# Deployment Guide - Vercel

Diese Anleitung zeigt, wie du die DWF Wushu Results Webapp auf Vercel deployen kannst.

## Voraussetzungen

1. GitHub Account mit diesem Repository
2. Vercel Account (kostenlos unter [vercel.com](https://vercel.com))
3. Turso Account für die Datenbank (kostenlos unter [turso.tech](https://turso.tech))

## Schritt 1: Turso Datenbank erstellen

### 1.1 Turso CLI installieren

```bash
# macOS/Linux
curl -sSfL https://get.tur.so/install.sh | bash

# Windows (PowerShell)
iwr -useb https://get.tur.so/install.ps1 | iex
```

### 1.2 Login und Datenbank erstellen

```bash
# Bei Turso anmelden
turso auth login

# Neue Datenbank erstellen
turso db create dwf-results

# Database URL abrufen
turso db show dwf-results --url

# Auth Token erstellen
turso db tokens create dwf-results
```

Notiere dir beide Werte (URL und Token) für später.

## Schritt 2: Auf Vercel deployen

### 2.1 Repository mit Vercel verbinden

1. Gehe zu [vercel.com/new](https://vercel.com/new)
2. Wähle "Import Git Repository"
3. Wähle dieses Repository aus
4. Klicke auf "Import"

### 2.2 Umgebungsvariablen konfigurieren

Im Vercel Deployment-Setup, füge folgende Umgebungsvariablen hinzu:

```
TURSO_DATABASE_URL=libsql://[your-database-url]
TURSO_AUTH_TOKEN=[your-auth-token]
API_KEY=[choose-a-secure-random-string]
```

**Wichtig:**
- `TURSO_DATABASE_URL` und `TURSO_AUTH_TOKEN` aus Schritt 1.2 übernehmen
- `API_KEY` selbst generieren (z.B. mit einem Password-Generator)
- Alle als "Production" und "Preview" Environment setzen

### 2.3 Deploy starten

1. Klicke auf "Deploy"
2. Warte bis der Build fertig ist (~2-3 Minuten)
3. Deine App ist jetzt live!

## Schritt 3: Daten importieren

### 3.1 Testdaten importieren

Du kannst die mitgelieferten Beispieldaten importieren:

```bash
curl -X POST https://your-app.vercel.app/api/import \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d @sample-data.json
```

Ersetze:
- `your-app.vercel.app` mit deiner Vercel URL
- `YOUR_API_KEY` mit dem API Key aus den Umgebungsvariablen

### 3.2 Eigene Daten importieren

Erstelle eine JSON-Datei mit deinen Daten im gleichen Format wie `sample-data.json`:

```json
{
  "event": {
    "name": "Veranstaltungsname",
    "year": 2025,
    "slug": "2025-veranstaltungsname",
    "date": "2025-MM-DD",
    "location": "Stadt"
  },
  "athletes": [
    {
      "name": "Athlet Name",
      "club": "Vereinsname"
    }
  ],
  "groups": [
    {
      "name": "Gruppenname",
      "category": "Kategorie",
      "age_group": "Altersklasse",
      "results": [
        {
          "athlete_name": "Athlet Name",
          "rank": 1,
          "score": 9.50,
          "difficulty": 2.0,
          "execution": 7.50
        }
      ]
    }
  ]
}
```

Dann importiere mit dem gleichen curl-Befehl.

## Schritt 4: Verifizieren

1. Öffne deine Vercel URL
2. Du solltest die importierten Veranstaltungen sehen
3. Klicke auf eine Veranstaltung um die Ergebnisse zu sehen

## Troubleshooting

### Build schlägt fehl
- Prüfe ob alle Dependencies in `package.json` korrekt sind
- Schaue in die Vercel Build Logs für Details

### Datenbank Verbindung schlägt fehl
- Überprüfe ob `TURSO_DATABASE_URL` und `TURSO_AUTH_TOKEN` korrekt gesetzt sind
- Teste die Verbindung lokal mit den gleichen Credentials

### Import API gibt 401 zurück
- Stelle sicher, dass der `x-api-key` Header gesetzt ist
- Überprüfe ob der API_KEY in den Umgebungsvariablen korrekt ist

### Keine Daten sichtbar
- Prüfe ob der Import erfolgreich war (Status 200)
- Schaue in die Vercel Function Logs für Fehler
- Teste die API direkt: `https://your-app.vercel.app/api/events`

## Updates deployen

Vercel deployed automatisch bei jedem Push zum main Branch:

1. Mache deine Änderungen lokal
2. Commit und push zu GitHub
3. Vercel deployed automatisch
4. Schaue in der Vercel Dashboard für den Deployment-Status

## Custom Domain (Optional)

1. Gehe zu deinem Projekt in Vercel
2. Klicke auf "Settings" → "Domains"
3. Füge deine Domain hinzu
4. Folge den DNS-Anweisungen
5. Warte auf DNS-Propagation (~24h)

## Kosten

- **Vercel Hobby Plan**: Kostenlos für persönliche Projekte
- **Turso Starter Plan**: Kostenlos bis 9 GB Storage und 500 GB Bandwidth

Für Produktionsumgebungen mit mehr Traffic solltest du die Paid Plans in Betracht ziehen.
