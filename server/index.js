// AERIS Honorar-AKI-Pool & Kalender-Koordination — Backend-Scaffold
// Status: implementiert, NICHT deployt — keine echte DB, kein echter Mailversand, kein Hosting.
// Vorbild: careinsight/server/index.js. Datenmodell + 4 Architekturentscheidungen sind
// product-design-Vorgabe (René-Direktive) und hier bewusst 1:1 umgesetzt, nicht neu entschieden.
//
// Persistenz: einfache JSON-Datei (data/store.json). FÜR PRODUKTION DURCH ECHTE DB ERSETZEN.
// Sessions/Magic-Link-Token: rein in-memory (Map) — Server-Neustart invalidiert sie, das ist
// im Scaffold-Stadium akzeptabel (kein Hosting-Dauerbetrieb vorgesehen).

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORE_PATH = path.join(__dirname, 'data', 'store.json');

const PORT = process.env.PORT || 3010;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const MAGIC_LINK_TTL_MS = 15 * 60 * 1000; // 15 Minuten, s. René-Vorgabe

// ---------------------------------------------------------------------------
// Enums (exakt nach product-design-Vorgabe, keine Zusatzwerte)
// ---------------------------------------------------------------------------
const RECHTSFORM = ['freiberuflich', 'gmbh'];
const BUNDESLAENDER = [
  'Baden-Württemberg', 'Bayern', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg',
  'Hessen', 'Mecklenburg-Vorpommern', 'Niedersachsen', 'Nordrhein-Westfalen',
  'Rheinland-Pfalz', 'Saarland', 'Sachsen', 'Sachsen-Anhalt',
  'Schleswig-Holstein', 'Thüringen',
];
const STELLENBESCHREIBUNG = ['sucheStammkunde', 'bieteStammkunde', 'sucheSpringer', 'bieteSpringer', 'mixStelle'];
const KALENDER_ART = ['springerVertretung', 'weitereStammkraftGesucht'];

// ---------------------------------------------------------------------------
// Persistenz — JSON-Datei. FÜR PRODUKTION DURCH ECHTE DB ERSETZEN.
// ---------------------------------------------------------------------------
function loadStore() {
  if (!fs.existsSync(STORE_PATH)) {
    const initial = { akiProfile: [], akiAccounts: [], verfuegbarkeitseintraege: [] };
    fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
}
function saveStore(store) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}
const store = loadStore();

// In-memory: Magic-Link-Token und Sessions (nicht persistiert, s. Kommentar oben).
const magicLinks = new Map(); // token -> { email, expiresAt }
const sessions = new Map(); // sessionToken -> { akiAccountId, email, createdAt }

const app = express();
// CORS: statisches Frontend (pool/) läuft lokal auf anderem Port/Origin (z.B.
// python3 -m http.server) als dieser API-Server — ohne CORS blockiert der
// Browser jeden Fetch per Same-Origin-Policy. Scaffold-Stadium, kein Deployment:
// origin:true spiegelt jede Anfrage-Origin zurück (offen für lokale Entwicklung).
// VOR ECHTEM DEPLOYMENT: auf konkrete erlaubte Origin(s) einschränken
// (z.B. origin: ['https://aeris-web.example'] statt true).
app.use(cors({
  origin: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// ---------------------------------------------------------------------------
// Auth-Helper (Session-geschützte Routen)
// ---------------------------------------------------------------------------
function requireSession(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: 'session_required' });
  }
  req.session = sessions.get(token);
  next();
}

// ---------------------------------------------------------------------------
// POST /api/aki/registrieren — öffentliches AkiProfil + zugehöriger AkiAccount
// ---------------------------------------------------------------------------
app.post('/api/aki/registrieren', (req, res) => {
  const {
    name, berufsbezeichnung, zertifizierungen, kontaktdaten, rechtsform,
    portfolio, persoenlicheBeschreibung, bundesland, stellenbeschreibung,
    einwilligungOeffentlichesProfil,
  } = req.body || {};

  // DSGVO-Pflichtfeld: granulare Einwilligung zur öffentlichen Profil-Anzeige,
  // getrennt von einer allgemeinen Account-Einwilligung (product-design-Vorgabe).
  if (einwilligungOeffentlichesProfil !== true) {
    return res.status(400).json({ error: 'einwilligung_oeffentliches_profil_erforderlich' });
  }
  if (!name || !berufsbezeichnung || !persoenlicheBeschreibung) {
    return res.status(400).json({ error: 'pflichtfelder_fehlen', felder: ['name', 'berufsbezeichnung', 'persoenlicheBeschreibung'] });
  }
  if (!kontaktdaten || typeof kontaktdaten.email !== 'string' || !kontaktdaten.email.includes('@')) {
    return res.status(400).json({ error: 'kontaktdaten_email_erforderlich' });
  }
  if (!RECHTSFORM.includes(rechtsform)) {
    return res.status(400).json({ error: 'rechtsform_ungueltig', erlaubt: RECHTSFORM });
  }
  if (!BUNDESLAENDER.includes(bundesland)) {
    return res.status(400).json({ error: 'bundesland_ungueltig', erlaubt: BUNDESLAENDER });
  }
  if (!STELLENBESCHREIBUNG.includes(stellenbeschreibung)) {
    return res.status(400).json({ error: 'stellenbeschreibung_ungueltig', erlaubt: STELLENBESCHREIBUNG });
  }
  if (zertifizierungen !== undefined && !Array.isArray(zertifizierungen)) {
    return res.status(400).json({ error: 'zertifizierungen_muss_array_sein' });
  }

  const bereitsRegistriert = store.akiAccounts.find((a) => a.email === kontaktdaten.email);
  if (bereitsRegistriert) {
    return res.status(409).json({ error: 'email_bereits_registriert' });
  }

  const profilId = crypto.randomUUID();
  const profil = {
    id: profilId,
    name,
    berufsbezeichnung,
    zertifizierungen: zertifizierungen || [],
    kontaktdaten: { email: kontaktdaten.email, telefon: kontaktdaten.telefon || null },
    rechtsform,
    portfolio: portfolio || null,
    persoenlicheBeschreibung,
    bundesland,
    stellenbeschreibung,
    // Kein Admin-Freischaltungs-Gate (René-Direktive 2026-10-02: "jeder AKI kann
    // sich anmelden") — Profil ist sofort nach Registrierung im Pool sichtbar.
    einwilligungOeffentlichesProfil: true,
    createdAt: new Date().toISOString(),
  };
  const account = {
    id: crypto.randomUUID(),
    email: kontaktdaten.email,
    verknuepftesProfilId: profilId,
    createdAt: new Date().toISOString(),
  };

  store.akiProfile.push(profil);
  store.akiAccounts.push(account);
  saveStore(store);

  return res.status(201).json({
    status: 'registriert',
    message: 'Profil angelegt und sofort im öffentlichen Pool sichtbar (kein Admin-Freischaltungsschritt).',
    profilId,
  });
});

// ---------------------------------------------------------------------------
// GET /api/aki/pool — alle registrierten Profile, filterbar (kein Freigabe-Gate)
// ---------------------------------------------------------------------------
app.get('/api/aki/pool', (req, res) => {
  const { bundesland, stellenbeschreibung } = req.query;
  let ergebnis = store.akiProfile;
  if (bundesland) ergebnis = ergebnis.filter((p) => p.bundesland === bundesland);
  if (stellenbeschreibung) ergebnis = ergebnis.filter((p) => p.stellenbeschreibung === stellenbeschreibung);
  res.json({ anzahl: ergebnis.length, profile: ergebnis });
});

// ---------------------------------------------------------------------------
// POST /api/auth/magic-link-anfordern — Login-Flow Schritt 1
// ---------------------------------------------------------------------------
app.post('/api/auth/magic-link-anfordern', (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'email_erforderlich' });

  const account = store.akiAccounts.find((a) => a.email === email);
  if (!account) return res.status(404).json({ error: 'account_nicht_gefunden_bitte_zuerst_registrieren' });

  const token = crypto.randomBytes(32).toString('hex');
  magicLinks.set(token, { email, accountId: account.id, expiresAt: Date.now() + MAGIC_LINK_TTL_MS });

  // Kein echter Mailversand im Scaffold-Stadium (analog Stripe-Scaffold-Prinzip) —
  // Link wird nur ins Server-Log geschrieben.
  const link = `${BASE_URL}/api/auth/magic-link-verifizieren?token=${token}`;
  console.log(`[Magic-Link] Für ${email} (15 Min. gültig): ${link}`);

  res.json({ status: 'versendet', message: 'Magic-Link wurde "versendet" (siehe Server-Log) — kein echter Mailversand im Scaffold-Stadium.' });
});

// ---------------------------------------------------------------------------
// GET /api/auth/magic-link-verifizieren — Login-Flow Schritt 2
// ---------------------------------------------------------------------------
app.get('/api/auth/magic-link-verifizieren', (req, res) => {
  const { token } = req.query;
  const eintrag = token ? magicLinks.get(token) : null;
  if (!eintrag) return res.status(400).json({ error: 'token_ungueltig' });

  magicLinks.delete(token); // Einmal-Nutzung
  if (Date.now() > eintrag.expiresAt) return res.status(410).json({ error: 'token_abgelaufen' });

  const sessionToken = crypto.randomBytes(32).toString('hex');
  sessions.set(sessionToken, { akiAccountId: eintrag.accountId, email: eintrag.email, createdAt: new Date().toISOString() });

  res.json({ status: 'eingeloggt', sessionToken });
});

// ---------------------------------------------------------------------------
// GET /api/kalender — Session-geschützt, volle Sichtbarkeit (Architekturentscheidung 4)
// ---------------------------------------------------------------------------
app.get('/api/kalender', requireSession, (_req, res) => {
  res.json({ anzahl: store.verfuegbarkeitseintraege.length, eintraege: store.verfuegbarkeitseintraege });
});

// ---------------------------------------------------------------------------
// POST /api/kalender/eintrag — Session-geschützt
// ---------------------------------------------------------------------------
app.post('/api/kalender/eintrag', requireSession, (req, res) => {
  const { datumVon, datumBis, art, notiz } = req.body || {};
  if (!datumVon || !datumBis) return res.status(400).json({ error: 'datumVon_und_datumBis_erforderlich' });
  if (!KALENDER_ART.includes(art)) return res.status(400).json({ error: 'art_ungueltig', erlaubt: KALENDER_ART });
  if (new Date(datumVon) > new Date(datumBis)) return res.status(400).json({ error: 'datumVon_nach_datumBis' });

  const eintrag = {
    id: crypto.randomUUID(),
    akiAccountId: req.session.akiAccountId,
    datumVon,
    datumBis,
    art,
    notiz: notiz || null,
    createdAt: new Date().toISOString(),
  };
  store.verfuegbarkeitseintraege.push(eintrag);
  saveStore(store);
  res.status(201).json({ status: 'angelegt', eintrag });
});

app.listen(PORT, () => console.log(`AERIS AKI-Pool-API läuft auf Port ${PORT} (${BASE_URL})`));
