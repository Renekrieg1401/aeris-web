# AERIS AKI-Pool & Kalender — Backend-Scaffold

Status: Code implementiert, **NICHT deployt** (kein Hosting, keine echte DB,
kein echter Mailversand). Analog zum Stripe-Scaffold in `careinsight/server/`.

## Endpoints
- `POST /api/aki/registrieren` — neues AkiProfil + AkiAccount, startet `pending`.
- `GET /api/aki/pool?bundesland=...&stellenbeschreibung=...` — nur `approved`.
- `POST /api/admin/freischalten` — Header `x-admin-secret`, Body `{profilId, freigabeStatus}`.
- `POST /api/auth/magic-link-anfordern` — Body `{email}`, Link landet im Server-Log.
- `GET /api/auth/magic-link-verifizieren?token=...` — liefert `sessionToken`.
- `GET /api/kalender` — Header `Authorization: Bearer <sessionToken>`, alle Einträge.
- `POST /api/kalender/eintrag` — Session-geschützt, legt Verfügbarkeit an.
- `GET /api/health` — Status-Check.

## Lokal starten
```
cp .env.example .env   # ADMIN_SECRET setzen
npm install
npm start               # Port 3010
```

## Was fehlt (bewusst offen, Scaffold-Grenze)
- Echter Mailversand (aktuell nur Server-Log).
- Echte Datenbank (aktuell JSON-Datei `data/store.json` + In-Memory-Sessions).
- Hosting/Deployment-Entscheidung.
