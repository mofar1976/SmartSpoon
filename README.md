# Kochfaul

Applikation für günstige KI-Rezepte, Wochenpläne und Einkaufslisten.

## Projektstruktur

- `Backend/`: NestJS-Backend mit TypeScript; [Startanleitung](Backend/README.md).
- `Frontend/`: Angular-Oberfläche mit Authentifizierung, Rezeptanfrage und Einkaufsliste; [Startanleitung](Frontend/README.md).
- `docs/PLAN.md`: [Architektur, Entscheidungen und Fortschritt](docs/PLAN.md).

## Gesamte Anwendung starten

```sh
cd Backend
docker compose up --build --wait
```

Oberfläche: http://localhost:8080

Swagger über denselben Ursprung: http://localhost:8080/api/docs

`FRONTEND_PORT` in `Backend/.env` ändert den Frontend-Port (Standard 8080). Bestehende MongoDB-Daten bleiben beim Start und bei `docker compose down` erhalten.

## Frontend mit automatischem Neuladen entwickeln

Für lokale Frontend-Entwicklung das Backend starten, dann in einem zweiten Terminal:

```sh
cd Frontend
npm ci
npm start
```

Oberfläche: http://localhost:4200

Registrierung, Anmeldung und Logout sind implementiert. Die geschützte Rezeptseite bietet ein Formular in drei Schritten und zeigt erzeugte Rezepte samt Einkaufskosten an. Die Einkaufsliste zeigt Packungen, Kosten und Restmengen; Artikel lassen sich temporär abhaken. [Frontend-Architektur und Plan](docs/FRONTEND_PLAN.md).

Das Backend unterstützt zusätzlich das dauerhafte Speichern kompletter Rezeptauswahlen und Einkaufslisten pro Nutzer. Im Frontend können Auswahlen gespeichert und unter „Gespeichert“ wieder geöffnet oder gelöscht werden; API-Vertrag in [Backend/README.md](Backend/README.md).
