# SmartSpoon Frontend

Angular 22.2, TypeScript 6, Standalone-Komponenten, Tailwind CSS 4.3 mit PostCSS, Utility-Layouts und zentralem Design-Theme. Node.js 24.15 oder neuer innerhalb der 24er-Reihe wird empfohlen; weitere unterstützte Versionen stehen in package.json.

## Lokal starten

Backend zuerst starten:

```sh
cd Backend
docker compose up -d --wait backend mongodb
```

In einem zweiten Terminal vom Projektstamm aus:

```sh
cd Frontend
npm ci
npm start
```

Frontend: http://localhost:4200

Der Entwicklungsserver lauscht lokal auf 127.0.0.1:4200. Aufrufe unter `/api/**` werden durch `proxy.conf.json` an http://127.0.0.1:3000 weitergeleitet. Bei geändertem Backend-Port das Proxy-Ziel anpassen und Angular neu starten. Backend-Schlüssel gehören ausschließlich in Backend/.env.

## Aktueller Umfang

- Responsive Startseite mit eigener Gestaltung und SVG-Illustration.
- App-Rahmen, Hauptnavigation, Seitentitel und lazy geladene Seiten.
- Echte Anmeldung unter `/anmelden` mit Benutzername und Passwort.
- Registrierung unter `/registrieren` mit Benutzername, Passwort und Geburtsdatum; danach direkt angemeldet.
- Geschützter Bereich `/rezepte` mit geführtem Formular: Einkauf → Essenswünsche → Zusammenfassung.
- Supermärkte aus der API, exakte Euro/Cent-Umrechnung, Formularvalidierung und echte Rezeptgenerierung.
- Ergebnisansicht mit Rezepten, Zutaten, Kochschritten, Gesamtkosten, Restbudget und Einkaufsliste zum Abhaken.
- Nicht gespeicherter Entwurf und Ergebnis ausschließlich im Arbeitsspeicher; Rücknavigation erhält Angaben, eine neue Anfrage oder Neuladen setzt sie zurück. Logout löscht sie; ein vorübergehender Entwurf nach Sitzungsablauf wird nur für denselben Nutzer übernommen.
- Tabbezogene Sitzung über sessionStorage, Prüfung über `/api/auth/me` beim Start und Logout in der Navigation. Ohne Refresh-Token erfolgt nach JWT-Ablauf eine erneute Anmeldung.
- Formularvalidierung, Passwortanzeige, Ladezustände und verständliche Fehler; bestehende Sitzung kann bei Verbindungsfehlern manuell erneut geprüft werden.
- Ansicht für unbekannte URLs, Sprunglink zum Inhalt und Fokusführung bei Seitennavigation.
- Deutsche Sprache und Locale, HttpClient und relative API-Basis `/api` vorbereitet.

## Prüfen und bauen

```sh
npm run typecheck
npm test
npm run build
```

Produktionsdateien: `dist/smartspoon-frontend/browser/`. Produktionshosting muss für Frontend-Routen auf `index.html` zurückfallen und `/api` an NestJS weiterleiten. Der Entwicklungsproxy gehört nicht zum Produktionsbuild. Docker-Einbindung ist eingerichtet (siehe unten).

Build, TypeScript, Navigation inklusive direktem Neuladen, unbekannte URLs, Sprunglink, Fokusführung und Breiten 320/390/768/1440 wurden geprüft. Backend-Bereitschaft über den Entwicklungsproxy bestätigt. 49 gezielte Tests prüfen Auth-Sitzung, Ablauf, Logout, API-Token-Grenzen, verspätete Antworten, Guard, Fehlerbehandlung, Formularvalidierung, exakte Cent-Umrechnung, Doppelklickschutz, Anfrageabbruch und temporäre Rezeptdaten. Browserprüfung gegen das reale Backend bestätigt Registrierung, Login, Neuladen und Logout; Fehlerzustände zusätzlich mit gezielten Mock-Antworten geprüft. Die Tests rufen Gemini nicht auf.

Architektur und nächste Schritte: [Frontend-Plan](../docs/FRONTEND_PLAN.md).

## Komponentenstruktur

Jede Komponente hat einen eigenen Ordner mit separaten `.ts`-, `.html`- und `.scss`-Dateien. Kein Inline-Template und keine Inline-Styles. Auth-Formular: `src/app/features/auth/auth-page/`.

## Sitzung

Nur der Zugangstoken wird in sessionStorage gespeichert, keine Passwörter oder Rezeptparameter. Der Benutzer wird nach dem Neuladen vom Backend geladen. Der Interceptor sendet den Token ausschließlich an die eigene relative API; Auth-Login und Registrierung erhalten keinen Bearer-Header. Ein aktueller geschützter API-Fehler 401 löscht die Sitzung und führt zur Anmeldung; ein verspäteter Fehler einer älteren Sitzung überschreibt keine neue Anmeldung. Bei Netzwerkfehlern bleibt der Token für einen manuellen Wiederholungsversuch erhalten. Login-/Registrierungsanfragen werden nicht automatisch wiederholt.

## Rezeptanfrage

Die Formulare akzeptieren die Grenzen der Backend-API: 0,01–1.000 € Budget, 1–10 Personen, 5–180 Minuten und 1–7 Rezepte. Budget ohne Tausendertrennzeichen eingeben, z. B. `40,29`. Ganze Packungen bestimmen die Einkaufskosten; die Auswahl deckt nicht automatisch eine vollständige Woche ab. Die angezeigten Preise sind fiktive Testwerte.

Der HTTP-Aufruf hat 70 Sekunden Zeitlimit, damit die maximal zwei Gemini-Aufrufe des Backends mit je 30 Sekunden innerhalb einer Anfrage Platz haben. Kein automatischer erneuter KI-Aufruf. Bei 422/429/502/503/504 oder Verbindungsausfällen bleiben die Eingaben für einen manuellen Versuch erhalten. Beim Verlassen der Rezeptseite während einer Anfrage wird der clientseitige HTTP-Aufruf abgebrochen; Backend-Arbeit kann bereits laufen.

Browser-Liveprüfung bestätigt drei vegane Rezepte aus dem gefilterten Testkatalog bei 40,29 € Budget: Einkaufskosten 13,03 €, Restbudget 27,26 €. Zusätzlich Ladezustand, exakter Payload, Rücknavigation, neue Anfrage, Neuladen, lokale Speicherung und mobile Ansichten sowie Fehlerfälle über gezielte Mock-Antworten geprüft. Ein eigens angelegter Nutzer wurde wieder gelöscht. Reguläre `npm test`-Läufe verwenden ausschließlich Mock-HTTP und senden keine Gemini-Anfragen.

## Einkaufsliste

Die Einkaufsliste zeigt pro Artikel die über alle Rezepte benötigte Menge, ganze Kaufpackungen, Kaufmenge, Restmenge, Preis pro Packung und Artikelkosten. Mengen und Kosten kommen unverändert vom Backend. Abhaken ändert weder Gesamtkosten noch Restbudget. Häkchen bleiben bei interner Navigation erhalten; Angaben ändern, neue Auswahl, neue Anfrage, Sitzungsablauf, Logout und Neuladen löschen sie. Keine Speicherung im Benutzerprofil oder Browser-Speicher.

Gezielte Tests bestätigen unveränderte Kosten und das Zurücksetzen der Häkchen. Browserprüfung mit Mock-API bestätigt Tastaturbedienung, Mengen in g/ml/Stück, Navigation, neue Auswahl und Neuladen. Mobile Breiten 320/390/768/1440 ohne Überlaufen; Desktop und Mobil visuell geprüft. Keine zusätzlichen Gemini-Aufrufe.

## Gesamte Anwendung mit Docker

Vom Projektstamm aus:

```sh
cd Backend
docker compose up --build --wait
```

Oberfläche: http://localhost:8080. Nginx liefert den Angular-Produktionsbuild und leitet `/api` an den internen Backend-Dienst weiter; kein Angular-Entwicklungsserver nötig. Direktes Öffnen/Neuladen von Frontend-Routen funktioniert über den SPA-Fallback. `/api/docs` enthält Swagger. `FRONTEND_PORT` in `Backend/.env` ändert den lokalen Port; Standard 8080. API-Adresse bleibt `/api`, keine Schlüssel im Frontend.

Der mehrstufige Docker-Build installiert und baut Angular mit Node 24; das Laufzeitimage enthält Nginx und die statischen Dateien. Der Frontend-Healthcheck `/healthz` prüft Nginx, `/api/health/ready` zusätzlich Backend und MongoDB. Compose wartet beim Start auf Backend-Bereitschaft. Proxy-Lesezeitlimit 75 Sekunden und keine automatische Wiederholung von Anfragen. Fingerprint-Dateien werden langfristig gecacht, index.html wird revalidiert, API-Antworten erhalten no-store.

Integration gegen den laufenden Docker-Stack:

```sh
cd Frontend
npm run test:docker
# Optional anderer Port:
FRONTEND_TEST_URL=http://127.0.0.1:8081 npm run test:docker
```

Prüft echte HTTP-Antworten für Angular-Routen, Assets, Cache-Header, API-Bereitschaft, Auth-Fehler und Swagger. Erstellt keine Nutzer und ruft Gemini nicht auf.

Nginx-Konfiguration basiert auf der offiziellen [Proxy-Dokumentation](https://nginx.org/en/docs/http/ngx_http_proxy_module.html) und [Upstream-DNS-Dokumentation](https://nginx.org/en/docs/http/ngx_http_upstream_module.html#server).

## Formatierung mit Prettier

```sh
cd Frontend
npm run format       # Dateien formatieren
npm run format:check # Formatierung nur prüfen
```

Für VS Code die empfohlene Erweiterung `esbenp.prettier-vscode` installieren/aktivieren. Workspace-Einstellungen wählen Prettier als Standardformatter und aktivieren Formatierung beim Speichern, sowohl beim Öffnen des Projektstamms als auch von Frontend/. Im Projektstamm wird das lokal installierte Prettier aus Frontend/node_modules genutzt; dafür zuerst npm ci im Frontend ausführen. Gemeinsame .prettierrc im Stamm und bestehende Angular-Konfiguration im Frontend; generierte Dateien, Lockfiles und .env-Dateien werden ausgeschlossen. Die bestehende Codebasis wurde nicht pauschal umformatiert.

## Gestaltung mit Tailwind

Angular Material und CDK wurden durch Tailwind ersetzt. `.postcssrc.json` integriert `@tailwindcss/postcss`; `src/tailwind.css` definiert die Designfarben und gemeinsamen Buttons/Formularfelder. Layouts, Abstände, Typografie, responsive Anpassungen und Zustände stehen als Tailwind-Utilities in den Templates. Preflight ist aktiviert; Design-Tokens für Farben, Typografie, Radien und Breakpoints stehen zentral im @theme. Komponenten-SCSS enthält keine Layout-Regeln mehr.

Einfache Auswahlfelder sind native Selects. `shared/ui/multi-select/` stellt eine Mehrfachauswahl über Angular ControlValueAccessor bereit: sichtbare Beschriftung, Checkboxen, Escape, Fokus-Rückgabe, Schließen bei Fokuswechsel/Klick außerhalb und gesperrter Zustand. Eigener Ordner mit TS/HTML/SCSS; kein Material nötig. Eingaben und Fehler verwenden explizite Labels und ARIA-Zuordnungen.

Die Integration folgt der offiziellen [Tailwind-Anleitung für Angular](https://tailwindcss.com/docs/installation/framework-guides/angular); die Basis verwendet [Preflight](https://tailwindcss.com/docs/preflight). Docker kopiert die PostCSS-Konfiguration in den Build.

## Gespeicherte Rezeptauswahlen

Die Ergebnisansicht bietet „Rezepte & Einkaufsliste speichern“ mit einem Namen (1–120 Zeichen). Gespeichert werden die unveränderte Generierungsantwort und der aktuelle Häkchenstand. Der Speichernachweis bleibt unverändert; unbekannte Produkt-Metadaten werden nicht aus der Antwort entfernt. Eingaben werden nicht ins Profil übernommen.

Unter `/gespeichert` zeigt die geschützte Übersicht Titel, Rezeptnamen, Datum und damalige Einkaufskosten. Die API lädt 20 Einträge pro Seite. `/gespeichert/:id` öffnet Rezepte und Einkaufsliste vollständig, auch nach Neuladen. Gespeicherte Häkchen werden wiederhergestellt; spätere Häkchenänderungen gelten nur für die aktuelle Detailansicht. Es gibt noch keine Bearbeitung gespeicherter Daten.

Löschen erfordert eine Bestätigung im nativen Dialog; Abbrechen/Escape lässt die Auswahl bestehen. Bei Fehlern bleibt der Dialog mit einem manuellen Wiederholungsversuch offen. Fehlende Auswahlen, Ladefehler, leere Übersicht und Speichernachweise älterer Ergebnisse werden verständlich angezeigt.

API-Aufrufe für Speicherung/Liste/Detail/Löschen haben zehn Sekunden Zeitlimit und keine automatischen Wiederholungen. Doppelte Speicher-/Löschklicks werden gesperrt. Nicht gespeicherte Daten bleiben im Arbeitsspeicher; Sitzungs-/Auswahlwechsel verwerfen alte Antworten und löschen lokalen Speicherstatus. Logout löscht keine dauerhaft gespeicherten Auswahlen auf dem Server. Auth-Rückkehr ist nur zu bekannten internen Rezept-/Speicherrouten möglich.

Geprüft: 49 Tests, TypeScript und Produktionsbuild. Live-Browserablauf mit temporärem Nutzer: echte Gemini-Generierung, Speichern, Öffnen/Neuladen, Häkchen-Wiederherstellung, Übersicht, Löschbestätigung und Schutz ohne Anmeldung. Speicher-/Löschfehler mit Mock-Antworten und manueller Wiederholung geprüft; mobile Breiten 320–1440 ohne Überlaufen. Testnutzer und gespeicherte Testdaten anschließend entfernt.

Das offizielle prettier-plugin-tailwindcss sortiert Klassen beim Formatieren und Speichern anhand unseres Themes. Die Prettier-Konfigurationen im Stamm und Frontend verweisen auf src/tailwind.css. Tailwind IntelliSense ist als VS-Code-Erweiterung empfohlen. Regeln und Beispiele: [FRONTEND_STYLING.md](../docs/FRONTEND_STYLING.md).
