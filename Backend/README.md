# Kochfaul Backend

NestJS-Backend für günstige KI-Rezepte und Wochenpläne. Architektur und Fortschritt: [docs/PLAN.md](../docs/PLAN.md).

## Start mit Docker

Alle Befehle in `Backend/` ausführen. Docker Desktop muss laufen.

```sh
docker compose up --build --wait
```

Compose baut Backend und Angular-Frontend, startet MongoDB und wartet auf die Bereitschaft aller drei Dienste. Die Dienste sind auf dem Rechner nur über `127.0.0.1` erreichbar. Die Konfiguration ist für lokale Entwicklung ausgelegt; MongoDB läuft hier ohne Anmeldung.

- Oberfläche: http://localhost:8080 (mit `/api`-Reverse-Proxy und Swagger unter `/api/docs`)
- HTTP-Erreichbarkeit: http://localhost:3000/api/health
- Datenbankbereitschaft: http://localhost:3000/api/health/ready
- Swagger: http://localhost:3000/api/docs
- OpenAPI: http://localhost:3000/api/docs-json

```sh
docker compose logs -f backend
docker compose down
```

`down` stoppt die Dienste; Daten bleiben im benannten Volume `mongodb_data` erhalten. `docker compose down --volumes` löscht auch die Daten.

## Lokale Entwicklung mit Node.js

Node.js ab 24.15 und npm erforderlich. MongoDB läuft in Docker, NestJS lokal mit automatischem Neustart:

```sh
# Nur falls noch keine .env vorhanden ist:
cp -n .env.example .env
# JWT_SECRET in .env mit einem zufälligen Schlüssel setzen (siehe .env.example).
npm ci
docker compose up -d --wait mongodb
npm run start:dev
```

Alternativ nach `npm run build` mit `npm start` starten. `.env` wird automatisch geladen; gesetzte Umgebungsvariablen haben Vorrang. `PORT` muss zwischen 1 und 65535 liegen; `MONGODB_URI` ist erforderlich. Für Rezeptgenerierung wird zusätzlich `GEMINI_API_KEY` benötigt.

In Compose verbindet sich das Backend mit `mongodb://mongodb:27017/kochfaul`; ein lokaler Node-Prozess nutzt `mongodb://127.0.0.1:27017/kochfaul`. Mit `MONGODB_PORT` lässt sich der veröffentlichte Datenbankport ändern; dann muss für lokale Node-Prozesse auch `MONGODB_URI` angepasst werden. `FRONTEND_PORT` bestimmt den lokalen Frontend-Port (Standard 8080). Für Backend ohne Frontend `docker compose up --build --wait backend mongodb` ausführen. `PORT` bestimmt den veröffentlichten HTTP-Port; im Container bleibt dieser 3000. Ist der Standard-Datenbankport bereits belegt, beispielsweise mit `MONGODB_PORT=27027 docker compose up --build --wait` starten.

## Bereitschaft

`GET /api/health` prüft die Erreichbarkeit der laufenden HTTP-Anwendung. `GET /api/health/ready` sendet einen MongoDB-Ping und liefert bei Erfolg HTTP 200 mit `{ "status": "ok", "database": "up" }`, bei Ausfall HTTP 503 mit `{ "status": "error", "database": "down" }`. Interne Verbindungsdetails werden nicht ausgegeben. Der Ping hat ein Zeitlimit von zwei Sekunden.

Beim initialen Start wartet NestJS auf MongoDB und beendet den Start nach begrenzten Verbindungsversuchen, falls diese nicht erreichbar ist. Nach einem späteren Datenbankausfall bleibt die HTTP-Anwendung erreichbar, während die Bereitschaft fehlschlägt. Mongoose verbindet sich nach Wiederherstellung automatisch erneut.

## Prüfung

```sh
npm run typecheck
npm test
docker compose config --quiet
```

Die Tests prüfen Konfiguration, erfolgreichen Datenbank-Ping sowie getrennte und fehlgeschlagene Verbindungen. Der Docker-Healthcheck nutzt den Bereitschafts-Endpunkt.

## Registrierung und Login

- `POST /api/auth/register`: Konto erstellen und Zugangstoken erhalten (201).
- `POST /api/auth/login`: Anmelden und Zugangstoken erhalten (200).
- `GET /api/auth/me`: Aktuellen Benutzer mit `Authorization: Bearer <accessToken>` abrufen.

Die Registrierung erwartet beispielsweise:

```json
{ "username": "student_01", "password": "MeinPasswort123!", "birthDate": "2000-05-15" }
```

Für den Login nur `username` und `password` senden. Das Geburtsdatum ist bei neuen Registrierungen verpflichtend und muss ein gültiges Kalenderdatum im Format `YYYY-MM-DD` sein, das nicht in der Zukunft liegt (Kalendertag in Europe/Berlin). Es wird als Datum ohne Uhrzeit gespeichert.

Benutzernamen enthalten 3–30 Zeichen aus `a-z`, Zahlen, `_` und `-`. Führende und nachfolgende Leerzeichen werden entfernt und Namen kleingeschrieben. Passwörter haben 8–128 Zeichen und werden unverändert verarbeitet. Zusätzliche Felder werden abgewiesen.

Die Antwort enthält `accessToken`, `tokenType`, `expiresIn` (3600 Sekunden) sowie `user` mit `id`, `username` und `birthDate`. Auch `/api/auth/me` enthält diese Felder. Bereits bestehende Benutzer ohne Geburtsdatum können weiterhin einloggen; ihre Antwort enthält `birthDate: null`. Im Swagger-Dialog „Authorize“ den Zugangstoken eingeben und danach `/api/auth/me` ausprobieren.

Passwörter werden mit einem individuellen Salt und scrypt gehasht gespeichert. Doppelte Namen liefern 409, ungültige Eingaben 400 und falsche Zugangsdaten oder ungültige/abgelaufene Tokens 401. Registrierung und Login erlauben jeweils 20 Anfragen pro Minute und IP pro Backend-Instanz; weitere Anfragen liefern 429. Der Zugangstoken läuft nach einer Stunde ab; anschließend erneut anmelden. Refresh-Tokens, Passwort-Reset und Logout mit serverseitiger Token-Sperre gehören noch nicht zu dieser Version.

`JWT_SECRET` ist erforderlich und muss mindestens 32 Zeichen lang sein. In der lokalen `.env` wurde ein zufälliger Schlüssel erzeugt; Compose übergibt ihn an das Backend. Ein Wechsel des Schlüssels macht vorhandene Tokens ungültig. `.env` wird weder versioniert noch in das Docker-Image kopiert.

Der zusätzliche Integrationstest nutzt einen separat gestarteten Teststack:

```sh
AUTH_TEST_URL=http://127.0.0.1:3108 node --test test/auth.integration.cjs
```

Nur gegen einen isolierten Teststack ausführen: Der Test erzeugt ein Benutzerkonto und prüft auch die Begrenzung von Login-Versuchen.

## Produktkatalog mit Testpreisen

Rezeptparameter (Budget, Supermarkt, Personenanzahl, Lebenssituation, Ernährung, Allergien und Kochzeit) werden bei jeder zukünftigen Rezeptanfrage neu eingegeben. Es gibt dafür kein gespeichertes Nutzerprofil.

Der Katalog enthält 36 fiktive Beispielprodukte: jeweils zwölf für `rewe`, `aldi` und `lidl`. Preise sind ganze Centbeträge pro Packung; Packungsmengen werden in `g`, `ml` oder `piece` angegeben. Namen und Preise sind Entwicklungsdaten und entsprechen keinen recherchierten Angeboten. Jedes Produkt trägt `priceType: "test"` und einen ausdrücklichen Quellenhinweis. `sourceUrl`, `location` und `observedAt` sind `null`, da keine echte Quelle, Filiale oder Preiserhebung vorliegt. Die Packungsmenge bezeichnet den Inhalt der gekauften Packung; Verarbeitung und Mengenverluste werden hier noch nicht modelliert.

Den laufenden Docker-Stack einmalig befüllen:

```sh
docker compose up --build --wait
docker compose exec backend node dist/scripts/seed-products.js
```

Oder mit lokal laufendem MongoDB/NestJS-Setup:

```sh
npm run seed:products
```

Der Seed legt fehlende Testprodukte anhand fester Kennungen an. Bei älteren, unveränderten Testprodukten ergänzt er ausschließlich noch fehlende Zutaten-, Ernährungs- und Allergenfelder. Bestehende Preise, Packungsmengen, Metadaten und Benutzer bleiben unverändert. Der Befehl kann mehrfach ausgeführt werden. Die Datenbank ist ohne diesen ausdrücklichen Seed zunächst leer; es werden beim Start keine Testpreise automatisch angelegt.

Alle Katalog-Endpunkte erfordern einen Bearer-Token:

| Endpunkt | Funktion |
| --- | --- |
| `GET /api/products/supermarkets` | Unterstützte Supermarkt-Kennungen |
| `GET /api/products?supermarket=rewe&limit=12&offset=0` | Produkte filtern und seitenweise laden |
| `GET /api/products/:id` | Einzelnes Produkt mit MongoDB-ID abrufen |

Ohne `supermarket` werden Produkte aller drei Supermärkte aufgelistet. `limit` liegt zwischen 1 und 100 (Standard 50), `offset` zwischen 0 und 100000 (Standard 0). Die Listenantwort enthält `items`, `total`, `limit`, `offset` und `priceNotice`. Ein unbekannter Supermarkt, ungültige Filter, ungültige IDs oder unerlaubte Parameter liefern 400; ein nicht vorhandenes Produkt liefert 404.

Nach Registrierung/Login im Swagger-Dialog „Authorize“ den Zugangstoken einsetzen und die Produkte abrufen. Aktuell gibt es keine öffentliche API zum Schreiben oder Löschen von Produkten; reale Preisquellen folgen später.

Der Produkt-Integrationstest erwartet einen isolierten, mit den Testdaten befüllten Stack:

```sh
PRODUCTS_TEST_URL=http://127.0.0.1:3109 node --test test/products.integration.cjs
```

## Rezepte mit Gemini erstellen

`POST /api/recipes/generate` ist geschützt und erwartet die aktuellen Angaben für diese Anfrage. Es werden weder Rezeptparameter im Benutzerprofil noch die generierten Rezepte in MongoDB gespeichert.

```json
{
  "supermarket": "rewe",
  "weeklyBudgetCents": 4000,
  "persons": 1,
  "lifeSituation": "student",
  "diet": "vegetarian",
  "allergies": [],
  "excludedIngredients": ["milk"],
  "maxCookingTimeMinutes": 30,
  "recipeCount": 3
}
```

- `weeklyBudgetCents`: 1–100000 Cent. Das Budget begrenzt die Summe aller gekauften Packungen für die gesamte Rezeptauswahl.
- `persons`: 1–10 Portionen pro Rezept.
- `lifeSituation`: `student`, `employee`, `self_employed`, `unemployed`, `retired` oder `other`.
- `diet`: `omnivore` (Standard), `vegetarian` oder `vegan`.
- `allergies`: Liste der im Swagger-Schema angebotenen Allergen-Kennungen (Standard leer).
- `excludedIngredients`: Zutatenkennungen aus `ingredientKey` im Produktkatalog, beispielsweise `milk`, `eggs` oder `chicken` (Standard leer).
- `maxCookingTimeMinutes`: 5–180 Minuten pro Rezept.
- `recipeCount`: 1–7 (Standard 3). Dies erzeugt Rezeptvorschläge; ein vollständiger Wochenkalender mit allen Mahlzeiten ist noch nicht implementiert.

Das Backend lädt Produkte des gewählten Supermarkts und filtert Ernährungsweise, Allergene und Ausschlüsse anhand der Katalogfelder. Produkte ohne diese Metadaten werden nicht verwendet. Die Felder im Testkatalog sind ebenfalls fiktive Entwicklungsdaten; echte Herstellerangaben und mögliche Spuren sind noch nicht erfasst. Die Prüfung bezieht sich auf strukturierte Zutaten; freie Kochtexte werden nicht semantisch verifiziert.

Das Alter wird aus dem Geburtsdatum anhand des aktuellen Kalendertags in Europe/Berlin berechnet. Gemini erhält nur das Alter, nicht das Geburtsdatum, den Benutzernamen, die Benutzer-ID oder das Passwort. Bestandskonten ohne Datum bleiben mit unbekanntem Alter nutzbar.

Gemini gibt strukturierte Rezepte mit Produkt-IDs, Mengen, Einheiten, Portionen, Kochzeit und Schritten zurück. Die Anfrage verwendet ein strukturelles `responseSchema` aus Gemini-Typen und Pflichtfeldern. Zod prüft die Antwortstruktur einschließlich Werte- und Längengrenzen, Produkt-ID-Format und unbekannter Felder; das Backend prüft Produktzuordnung und Einheiten, Rezeptanzahl, Portionen und Kochzeit. Anschließend fasst es Zutaten über alle Rezepte zusammen, rundet die Mengen auf ganze Kaufpackungen auf und berechnet Kosten ausschließlich aus den Katalogpreisen. Eine ungültige fachliche Auswahl wird höchstens einmal nachgebessert. Reicht dies nicht, liefert die API 422 statt einer Auswahl über Budget.

Die erfolgreiche Antwort enthält `recipes`, `shoppingList`, `totalCostCents`, `remainingBudgetCents`, `currency`, `priceType` und `priceNotice`. Einkaufspositionen enthalten das Produkt, benötigte Menge, Packungsanzahl, gekaufte Menge, Restmenge und Kosten. Keine geschätzten Modellpreise werden übernommen. Alle Preise bleiben als Testpreise gekennzeichnet.

### Gemini konfigurieren

In `.env` den eigenen Schlüssel aus [Google AI Studio](https://aistudio.google.com/) unter `GEMINI_API_KEY` ergänzen. Der bestehende Schlüsselplatzhalter bleibt leer, solange kein eigener Schlüssel eingetragen wurde.

```dotenv
GEMINI_API_KEY=<eigener Schlüssel>
GEMINI_MODEL=gemini-3.5-flash-lite
```

Der Modellname ist konfigurierbar. Flash-Lite wird derzeit mit einem kostenlosen API-Kontingent aufgeführt; die tatsächlichen Limits hängen vom Projekt ab. Siehe [offizielle Preise](https://ai.google.dev/gemini-api/docs/pricing) und [strukturierte Antworten](https://ai.google.dev/gemini-api/docs/generate-content/structured-output). Der SDK-Aufruf nutzt keine Websuche; Produktpreise stammen aus unserem Katalog.

Nach Ergänzung des Schlüssels starten und den Testkatalog einschließlich neuer Metadaten laden:

```sh
docker compose up --build --wait
docker compose exec backend node dist/scripts/seed-products.js
```

Dann in Swagger anmelden, den Zugangstoken über „Authorize“ einsetzen und `/api/recipes/generate` ausprobieren. Ohne Gemini-Schlüssel bleibt das übrige Backend nutzbar; die Rezeptanfrage mit passendem Katalog liefert 503. Jeder Gemini-Aufruf hat 30 Sekunden Zeitlimit und keine automatischen SDK-Wiederholungen. Pro Anfrage sind höchstens zwei Aufrufe möglich. Der Endpunkt erlaubt fünf Anfragen pro Minute/IP/Backend-Instanz.

Fehler: 400 bei ungültigen Eingaben, 401 ohne gültigen Login, 422 ohne passende Produkte oder Rezeptauswahl, 429 beim lokalen Anfragelimit, 502 bei ungültiger KI-Antwort oder fehlgeschlagenem KI-Aufruf, 503 bei fehlender Konfiguration oder ausgeschöpftem Gemini-Kontingent, 504 bei KI-Zeitüberschreitung. Interne Providerdetails werden nicht zurückgegeben.

### Rezept-Integrationstest

Der Test nutzt echte MongoDB und das echte Gemini-SDK gegen einen lokalen Mockserver. Es werden keine Google-Anfragen gesendet und keine echten API-Schlüssel benötigt. Er muss gegen eine isolierte Testdatenbank laufen und legt dort Testprodukte und ein Testkonto an:

```sh
RECIPES_TEST_MONGODB_URI=mongodb://127.0.0.1:27030/kochfaul node --test test/recipes.integration.cjs
```

## Rezeptauswahl und Einkaufsliste speichern

Die Backend-API unterstützt jetzt dauerhaft gespeicherte Auswahlen pro Nutzer. Das Frontend bietet Speichern in der Ergebnisansicht und die Übersicht unter /gespeichert. Generierung allein speichert weiterhin nichts. Sie liefert zusätzlich `saveProof`, einen 24 Stunden gültigen signierten Nachweis für genau dieses Ergebnis und diesen Nutzer. Er ist kein Zugangstoken; alle Speicher-Endpunkte erfordern weiterhin die normale Anmeldung.

| Methode | Pfad | Verhalten |
| --- | --- | --- |
| POST | `/api/saved-recipes` | Auswahl speichern (201) |
| GET | `/api/saved-recipes?limit=20&offset=0` | Eigene Auswahlen, neueste zuerst, Zusammenfassungen mit Gesamtanzahl (200) |
| GET | `/api/saved-recipes/:id` | Vollständige eigene Auswahl mit Rezepten und Einkaufsliste (200) |
| DELETE | `/api/saved-recipes/:id` | Eigene Auswahl löschen (204) |

POST erwartet `{ "result": <vollständige Antwort von /api/recipes/generate>, "title": "Mein Einkauf", "checkedProductIds": [] }`. `title` optional, nach Trim 1–120 Zeichen; Standard ist der erste Rezepttitel. `checkedProductIds` optional, maximal 100 eindeutige Produkt-IDs aus dieser Einkaufsliste. `result` unverändert einschließlich saveProof senden. Keine Benutzer-ID senden: Eigentümer kommt ausschließlich aus dem Zugangstoken.

Gespeichert werden Rezepte einschließlich Zutaten/Kochschritten, komplette Produktdetails, Packungen/Mengen/Reste, damalige Centpreise, Gesamt-/Restbudget, Preiskennzeichnung und anfängliche Häkchen. Eingabeparameter, Lebenssituation, Allergien, Geburtsdatum und signierter Nachweis werden nicht zusätzlich gespeichert; Benutzerprofil bleibt unverändert. `generatedAt` bezeichnet die Generierung, `createdAt` das Speichern. Die gespeicherten Testpreise bleiben ausdrücklich fiktiv.

Das Backend prüft die serverseitige Signatur und den Hash des Ergebnisses. Geänderte Rezepte/Preise/Mengen, fremde oder abgelaufene Nachweise liefern 400. Beim Speichern werden weder KI noch Produktpreise erneut abgefragt; die Momentaufnahme bleibt bei späteren Katalogänderungen unverändert. Abgelaufener Speichernachweis bedeutet neue Generierung; bereits gespeicherte Auswahlen bleiben dauerhaft abrufbar.

Erneutes bzw. gleichzeitiges Speichern derselben Generierung liefert dieselbe ID und erzeugt keine Duplikate. Der erste gespeicherte Titel und die ersten Häkchen bleiben dabei erhalten. Änderungen an gespeicherten Auswahlen sind in diesem Schritt nicht vorgesehen. Liste: limit 1–50, offset 0–100000. Fremde und nicht vorhandene IDs liefern bei Detail/Löschen gleichermaßen 404; ungültige IDs/Query/Eingaben 400, ohne Anmeldung 401. Swagger enthält alle neuen Antwortschemas.

Gezielte Integration mit isolierter MongoDB und Mock-KI:

```sh
npm run build
SAVED_RECIPES_TEST_MONGODB_URI=mongodb://127.0.0.1:27027/kochfaul_saved_verification_local node --test test/saved-recipes.integration.cjs
```

Port passend zur lokalen MongoDB wählen. Das Script verlangt den reservierten Datenbanknamenspräfix und löscht diese Testdatenbank am Ende. Es sendet keine echten Gemini-Anfragen.
