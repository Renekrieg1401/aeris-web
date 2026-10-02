# Handoff — AERIS Web (2026-10-02)

## Status
Silo frisch registriert (`CLAUDE.md` neu angelegt), AERIS-Pool-Feature vollständig durch den geschlossenen Regelkreis: `product-design` → `backend-server` → `testing-qa` ×2 → `frontend-ui` → `accessibility-a11y` ×2 → `quality-management` → `legal-compliance` ×2. Alle Verify-Schritte bestanden.

## Was existiert
- `index.html`/`app.css`/`app.js` — Haupt-Landingpage (Renés eigenes Einzelprofil, unverändert bis auf den neuen „AKI-Pool"-Nav-Punkt + Hash-Deep-Link-Handler für Legal-Overlays).
- `buchhaltung/` — eigener Unterordner (noch nicht geprüft/registriert, nur bei Bedarf anfassen).
- `pool/` — neues AKI-Pool-Feature: `index.html` (Such-/Filterpool), `registrieren.html`, `login.html` (Magic-Link), `kalender.html` (geschlossener Bereich).
- `server/` — Express-Backend-Scaffold (lokal, NICHT live/deployed): Admin-Review-Pflicht, Magic-Link-Login ohne Passwort, volle Kalender-Sichtbarkeit, CORS konfiguriert.

## Offene Punkte (nicht blockierend)
- Kein echter Mailversand/keine echte DB/kein Hosting für `server/` — bewusst Scaffold-Stand.
- `[Telefonnummer]`-Platzhalter in der Haupt-Datenschutzerklärung noch nicht final ausgefüllt.
- Zuständigkeits-Hinweis für die Aufsichtsbehörde (Hessen) im Beschwerderecht-Abschnitt noch mit „voraussichtlich"/Prüf-Hinweis markiert — vor echter Veröffentlichung final bestätigen.

## Governance-Referenz
`CLAUDE.md` in diesem Ordner für Details zur gesamten Bau-/Verify-Kette. Root-`_MAINTENANCE-MANIFEST.md` für den Session-Eintrag vom 2026-10-02.
