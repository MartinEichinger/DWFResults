# DWF Wushu Competition Results

Eine Next.js Webapp zur Anzeige von Wushu Wettkampfergebnissen.

## Features

- 📊 Anzeige von Wettkampfergebnissen in übersichtlichen Tabellen
- 🗄️ Datenspeicherung in Turso Database (SQLite)
- 🧠 Redux Store (Redux Toolkit), der die Datenbankinhalte im Browser hält
- ⚡ Live-Aktualisierung der Anzeige bei jedem Datenbank-Update – ohne Seiten-Refresh
- 🔄 API für externe Datenimporte
- 📱 Responsive Design mit Tailwind CSS
- 🌐 Deployment auf Vercel

## Setup

### 1. Dependencies installieren

```bash
npm install
```

### 2. Umgebungsvariablen konfigurieren

Kopiere `.env.example` zu `.env.local` und fülle die Werte aus:

```bash
cp .env.example .env.local
```

Benötigte Variablen:
- `TURSO_DATABASE_URL`: URL deiner Turso Datenbank
- `TURSO_AUTH_TOKEN`: Auth Token für Turso
- `API_KEY`: Sicherer API-Schlüssel für Datenimporte

### 3. Turso Database einrichten

1. Installiere Turso CLI: https://docs.turso.tech/cli/installation
2. Erstelle eine neue Datenbank:
   ```bash
   turso db create dwf-results
   ```
3. Hole die Database URL:
   ```bash
   turso db show dwf-results --url
   ```
4. Erstelle ein Auth Token:
   ```bash
   turso db tokens create dwf-results
   ```

### 4. Development Server starten

```bash
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000) im Browser.

## Datenstruktur

### Events (Veranstaltungen)
- `id`: Eindeutige ID
- `name`: Name der Veranstaltung
- `year`: Jahr
- `slug`: URL-freundlicher Identifier
- `date`: Datum (optional)
- `location`: Ort (optional)

### Groups (Wettkampfgruppen)
- `id`: Eindeutige ID
- `event_id`: Referenz zur Veranstaltung
- `name`: Gruppenname
- `category`: Kategorie (optional)
- `age_group`: Altersklasse (optional)

### Athletes (Athleten)
- `id`: Eindeutige ID
- `name`: Name
- `club`: Verein (optional)

### Results (Ergebnisse)
- `id`: Eindeutige ID
- `group_id`: Referenz zur Gruppe
- `athlete_id`: Referenz zum Athleten
- `rank`: Platzierung
- `score`: Gesamtpunktzahl
- `difficulty`: Schwierigkeitspunkte
- `execution`: Ausführungspunkte
- `judge_scores`: JSON mit Kampfrichterbewertungen (optional)

## API Endpunkte

### GET /api/events
Gibt alle Veranstaltungen zurück.

### GET /api/events/[slug]
Gibt Details und Ergebnisse für eine spezifische Veranstaltung zurück.

### GET /api/events/[slug]/stream
Server-Sent-Events Stream. Sendet ein `update`-Event, sobald die Daten der Veranstaltung
über eine der POST-Routes geändert wurden. Der Browser lädt daraufhin die Daten in den
Redux Store nach, sodass die Anzeige ohne Seiten-Refresh aktuell bleibt.

### POST /api/import
Importiert Daten von extern. Benötigt `x-api-key` Header.

## Redux Store

Der Redux Store (`lib/store`) hält die Daten der Datenbank (Struktur siehe `lib/db.ts`):

- `events` – Liste aller Veranstaltungen (`a_events`), geladen über `GET /api/events`
- `eventResults` – pro Slug die komplette Veranstaltung inkl. Startgruppen, Kategorien,
  Formen und Teilnehmern, geladen über `GET /api/events/[slug]`

Der Store wird über `app/StoreProvider.tsx` bereitgestellt. Die Seiten lesen ihre Daten
ausschließlich aus dem Store. Der Hook `useEventResultsLiveUpdates` abonniert den
SSE-Stream (mit Polling-Fallback) und lädt die Daten nach jedem Datenbank-Update neu.

## Daten importieren

### Mit dem Import-Script (empfohlen)

Das einfachste Verfahren ist das mitgelieferte Import-Script:

```bash
# Sample-Daten importieren (benötigt API_KEY in .env.local)
npm run import sample-data.json

# Mit explizitem API-Key
npm run import sample-data.json http://localhost:3000 your-api-key

# Zu Vercel deployen
npm run import sample-data.json https://your-app.vercel.app your-api-key
```

### Mit cURL

Beispiel Request:
```bash
curl -X POST http://localhost:3000/api/import \
  -H "Content-Type: application/json" \
  -H "x-api-key: your_api_key" \
  -d '{
    "event": {
      "name": "Deutsche Meisterschaft",
      "year": 2024,
      "slug": "2024-deutsche-meisterschaft",
      "date": "2024-06-15",
      "location": "Berlin"
    },
    "athletes": [
      {
        "name": "Max Mustermann",
        "club": "Wushu Club Berlin"
      }
    ],
    "groups": [
      {
        "name": "Taolu Männer",
        "category": "Taolu",
        "age_group": "Erwachsene",
        "results": [
          {
            "athlete_name": "Max Mustermann",
            "rank": 1,
            "score": 9.45,
            "difficulty": 2.0,
            "execution": 7.45
          }
        ]
      }
    ]
  }'
```

## Deployment auf Vercel

1. Push den Code zu GitHub
2. Verbinde dein Repository mit Vercel
3. Setze die Umgebungsvariablen in Vercel:
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
   - `API_KEY`
4. Deploy!

## Technologie-Stack

- **Framework**: Next.js 15 (App Router)
- **Sprache**: TypeScript
- **State Management**: Redux Toolkit / react-redux
- **Styling**: Tailwind CSS
- **Datenbank**: Turso (LibSQL/SQLite)
- **Hosting**: Vercel

## Lizenz

MIT