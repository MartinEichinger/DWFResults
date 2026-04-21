# DWFResults

Next.js-Webapp zur Anzeige von Wushu-Wettbewerbsergebnissen mit Daten aus einer eigenen Datenbank (Turso/libSQL).

## Start

```bash
npm install
npm run dev
```

## Konfiguration

Für Turso auf Vercel `TURSO_DATABASE_URL` und optional `TURSO_AUTH_TOKEN` setzen.

Optional kann für externes Schreiben ein API-Key geschützt werden:

- `INGEST_API_KEY` (bei gesetztem Wert muss `Authorization: Bearer <KEY>` gesetzt werden)

Ohne Turso-Variablen wird lokal eine SQLite-Datei unter `./dwfresults.db` verwendet.

## Ergebnisse extern schreiben

`POST /api/results`

Beispiel:

```json
{
  "results": [
    {
      "eventName": "DWF Deutsche Meisterschaft",
      "year": 2026,
      "groupName": "Taolu Herren",
      "rank": 1,
      "athleteName": "Max Mustermann",
      "clubName": "Wushu Club Berlin",
      "score": 9.45
    }
  ]
}
```

Navigation und Ergebnisseiten werden daraus automatisch pro Veranstaltung + Jahr erzeugt.
