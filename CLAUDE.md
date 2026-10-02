# AERIS Web | Silo-Governance (Genesis 2026-10-02)

> Genesis-Eintrag, nachträglich registriert nach `quality-management`-Befund „Silo wurde bearbeitet, nie registriert" (2026-10-02). Repo war bereits vor diesem Eintrag geklont und mit dem AERIS-Pool-Feature bebaut — dieser Eintrag holt die Registrierung nach, keine rückwirkende Neubewertung der bereits erfolgten Arbeit.

## Was ist AERIS Web
Separates Repo `Renekrieg1401/aeris-web` — AERIS-Marketing-Landingpage für René/AERIS als freiberuflichen AKI (§18 Abs.1 Nr.1 EStG, `index.html:288`). Dark-Glassmorphism-Design, PWA (`manifest.json`+`sw.js`).

**Nicht zu verwechseln mit `Projekte/aeris/`** (AERIS Dokumentation + AERIS Buch, separates Repo `aeris-app-finanz`).

## Quelle & Eigentum
- GitHub: `Renekrieg1401/aeris-web` (persönlicher Account)
- Lokal: `/Users/kriegrene/Development/IRIS-DIGITAL/Projekte/aeris-web/`

## Design-Tokens (bereits in Root-CLAUDE.md § Design-Token-Masterübersicht eingetragen, 2026-10-02)
`#131B27` (BG) · `#2B4570` (Theme) · Bronze-Gradient `#6B4423→#B87333→#E8C39E` · Card-Gradient `#303F58→#253349→#1A2536` · Input-BG `#253144`

## Feature: AERIS-Pool (Vermittlungsplattform für Honorar-AKIs, Genesis 2026-10-02)
Neues Feature unter `/pool/` — Registrierung + Suche/Filter-Pool für freiberufliche/GmbH-AKIs, plus geschlossener Kalenderbereich (Magic-Link-Login) für Springer-/Stammkraft-Vermittlung untereinander.

**Architektur:** Neuer Backend-Scaffold `server/` (Express, lokal, NICHT live/deployed — analog `careinsight/server/`). Datenmodell: `AkiProfil` (Admin-Review-Pflicht vor Veröffentlichung), `AkiAccount` (Magic-Link-Login, kein Passwort), `Verfuegbarkeitseintrag` (Kalender, volle Sichtbarkeit zwischen allen Accounts).

**Bau-Kette (2026-10-02, alle Schritte einzeln sequenziell, nie parallel):** `product-design` (Konzept) → `backend-server` (Scaffold) → `testing-qa` (PASS) → `frontend-ui` (4 Seiten: `pool/index.html`, `registrieren.html`, `login.html`, `kalender.html`) → `testing-qa` E2E im echten Browser ohne Security-Flags (PASS) → `backend-server` (CORS-Nachfix) → `accessibility-a11y` (3 WCAG-Verstöße gefunden: Fehlerfarbe-Kontrast, Checkbox-accent-color-Kontrast, Checkbox-Touch-Target) → `frontend-ui` (alle 3 behoben) → `accessibility-a11y` (unabhängig bestätigt, Fall geschlossen) → `quality-management` (Prozessprüfung).

## Status — GENESIS, OFFENE PUNKTE

**quality-management-Befund (2026-10-02):**
- ✅ **DSGVO-Lücke GESCHLOSSEN (frontend-ui-Fix 2026-10-02, legal-compliance-Gegenprüfung 2026-10-02 bestätigt):** Alle 3 Erhebungspunkte (`registrieren.html`, `login.html`, `kalender.html`) haben vollständige Art.-13-Hinweise (Verantwortlicher/Zweck/Rechtsgrundlage/Empfänger/Speicherdauer), korrekt differenziert nach Vertragsanbahnung vs. -durchführung, keine unnötige Zusatz-Checkbox. Deep-Link zu `index.html#ae-legal-datenschutz` technisch verifiziert funktionsfähig (`openLegal()`, kein Totlink). **Verbesserungshinweis (kein Blocker):** Haupt-Datenschutzerklärung sollte perspektivisch einen eigenen AKI-Pool-Abschnitt erhalten statt nur generische Website-Angaben.
- ✅ Vier-Augen-Prinzip eingehalten (inkl. CORS-Fix-Gegenprüfung durch testing-qa — fand in der Session statt, war nur nicht dateibasiert dokumentiert, jetzt hier nachgetragen).
- ✅ Silo-Isolation eingehalten, Demo-Gate-Policy eingehalten (Backend klar als „nicht deployt" markiert), GLOBAL_SOURCE_OF_TRUTH_MANDATE eingehalten (Tokens stichprobenartig gegen echte Quelle verifiziert).

**Noch offen:**
- Kein `handoff.md` für dieses Silo vorhanden.
- Backend-Scaffold: kein echter Mailversand (nur Server-Log), keine echte DB, kein Hosting — bewusst, analog Stripe-Scaffold-Muster.
- Verbesserungshinweis (nicht blockierend): eigener AKI-Pool-Abschnitt in der Haupt-Datenschutzerklärung.

**AERIS-Pool-Feature: VOLLSTÄNDIG DURCH DEN GESCHLOSSENEN REGELKREIS (2026-10-02).** Alle Verify-Schritte (testing-qa ×2, accessibility-a11y ×2, quality-management, legal-compliance ×2) unabhängig bestanden.

**Header-Tabs „Pflegesuchend"/„Stellensuchend" (Nachtrag 2026-10-02):** Zielgruppen-Weiche im Header aller 5 Seiten (`index.html` + 4× `pool/*.html`), ersetzt den alten Einzel-„AKI-Pool"-Link. Aktiv-Zustand per `aria-current="page"` + Bronze-Markierung. Verify-Kette: `testing-qa` PASS (Navigation/Mobile/Konsole) → `accessibility-a11y` fand 2 Verstöße (Non-Text-Kontrast aktive Füllung, Touch-Target Sidebar) → `frontend-ui`-Fix (Bronze-Ring `#B87333` statt Füllungsänderung, da Text- und Non-Text-Kontrast mathematisch nicht gleichzeitig per Gradient lösbar; Sidebar-Padding erhöht) → `accessibility-a11y`-Gegenprüfung mit vollständigem Gradient-Sweep bestätigt. Fall geschlossen.
