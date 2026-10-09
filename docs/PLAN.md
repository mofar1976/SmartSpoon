# SmartSpoon – vereinbarte Planung

Stand: 8. Oktober 2026.

## Produkt

Menschen erhalten günstige Rezepte, Wochenpläne und Einkaufslisten anhand von Supermarkt, Wochenbudget und Lebenssituation. Weitere Eingaben: Geburtsdatum, Personenanzahl, Ernährung, Allergien und Kochzeit. Das Alter wird später aus dem Geburtsdatum abgeleitet und bei der KI-Planung berücksichtigt; nicht als dauerhaft gespeichertes Alter. Zutaten sollen über mehrere Gerichte genutzt werden, um Reste zu reduzieren.

## Entscheidungen

- Backend im Ordner `Backend/`, einschließlich package.json, Konfiguration und Umgebungsbeispiel. Angular-Frontend im separaten Ordner `Frontend/`; Frontend-Planung auf Nutzerwunsch begonnen. Gemeinsame Planung und Projektanweisungen bleiben im Projektstamm.
- TypeScript und NestJS als modularer Monolith mit REST API und Swagger.
- MongoDB mit Mongoose für persistente Daten.
- Docker Compose für Anwendung und MongoDB.
- Gemini API mit offiziellem @google/genai-SDK; Standardmodell gemini-3.5-flash-lite, per GEMINI_MODEL austauschbar. Kostenloses Kontingent laut aktueller offizieller Preisseite; tatsächliche Verfügbarkeit/Limits vom Google-Projekt abhängig.
- KI-Anbieter hinter einer Schnittstelle kapseln, damit er austauschbar bleibt.
- Im Benutzerkonto bleiben Benutzername, Passwort-Hash und Geburtsdatum. Rezeptparameter werden nicht als Benutzerpräferenzen gespeichert.
- Controller nehmen HTTP-Anfragen entgegen; Services enthalten Geschäftslogik; Provider kapseln externe Anbindungen.
- Noch keine Microservices, Warteschlangen oder zusätzliche Infrastruktur.

## Fachliche Module

- Kein profiles-Modul für Rezeptparameter: Budget, Personenanzahl, Lebenssituation, Supermarkt, Ernährung, Allergien und Kochzeit werden bei jeder neuen Rezeptanfrage eingegeben und nicht im Benutzerprofil gespeichert.
- products: Produkte und Preise samt Packungsgröße, Quelle, Standort und Erhebungsdatum.
- meal-plans: Orchestrierung, Rezepte, Wochenplan, Einkaufsliste und Budgetprüfung.
- ai: Gemini-Anbindung und Validierung strukturierter Antworten.
- health: HTTP-Erreichbarkeit und Datenbankbereitschaft über einen zeitlich begrenzten MongoDB-Ping.
- auth: Registrierung mit Benutzername/Passwort/Geburtsdatum, Login mit Benutzername/Passwort, scrypt-Hashes, JWT-Zugangstokens und geschützter aktueller Benutzer.

## Ablauf der Wochenplanung

1. Eingaben validieren.
2. Verfügbare Produkte und Preise laden.
3. Gemini erstellt einen Vorschlag ausschließlich anhand dieser Produkte.
4. Backend prüft Mengen, Zutaten und Nutzervorgaben und berechnet Kosten.
5. Gültigen Plan speichern; ansonsten begrenzt nachbessern oder fehlende Machbarkeit melden.

Geld wird in ganzen Centbeträgen verarbeitet. Tatsächlich benötigte ganze Packungen bestimmen die Einkaufskosten. Preise werden niemals erfunden. Fehlende oder geschätzte Preise müssen klar gekennzeichnet sein. Zunächst nutzen wir einen als Testdaten gekennzeichneten Katalog; reale Preisquellen sind noch offen. Websuche allein garantiert keine aktuellen Filialpreise.

## Umsetzungsschritte

1. NestJS-Grundgerüst, Health-Endpunkt, Swagger und Startanleitung.
2. Docker Compose und MongoDB/Mongoose mit Datenbankbereitschaft.
3. Validierte Eingaben pro Rezeptanfrage, ohne Speicherung im Profil (statt Nutzerprofilen).
4. Produkte und Testpreiskatalog.
5. Gemini-Provider und validierte strukturierte Rezeptantworten.
6. Wochenplanung, Einkaufsliste und deterministische Budgetprüfung.
7. Benutzerkonten und weitere Absicherung nach Bedarf.

## Fortschritt

- Schritt 1 abgeschlossen: NestJS-Grundgerüst, Health-Endpunkt, Swagger, Entwicklungsstart und Startanleitung.
- Geprüft: TypeScript-Prüfung und Build erfolgreich; HTTP-Tests für Health (200), Swagger (200), OpenAPI mit Health-Route und unbekannte Route (404) bestanden. Testprozess anschließend beendet.
- npm-Installation erfolgreich; Audit meldet keine Schwachstellen. Swagger nutzt über einen gezielten Override js-yaml ab 5.4.3, da dessen Abhängigkeitsbereich noch eine betroffene Version auflöste. Bei Swagger-Updates Override erneut prüfen.
- Schritt 2 abgeschlossen: Dockerfile mit getrennten Build-/Runtime-Stufen, Compose mit MongoDB 8.0 und persistentem Volume, Mongoose-Anbindung, validierte Umgebungsvariablen und automatisch geladene .env.
- Datenbankbereitschaft: `/api/health/ready` liefert bei erfolgreichem Ping 200 und bei Ausfall 503; `/api/health` bleibt eine reine HTTP-Erreichbarkeitsprüfung.
- Geprüft für Schritt 2: TypeScript und Build, fünf automatisierte Tests, Compose-Konfiguration, Docker-Image-Build und gesunde Container. Integrationstest bestätigt Bereitschaft 200, Ausfall 503 bei weiterhin erreichbarer Anwendung, automatische Wiederverbindung, persistierte Daten nach MongoDB-Neustart sowie Swagger/OpenAPI.
- Docker-Test erfolgte im separaten Projekt `smartspoon-verification` mit Ports 3107 und 27027, da 27017 bereits belegt ist. Testcontainer und Testnetzwerk anschließend entfernt; das separate Testvolume bleibt erhalten.
- npm meldet nach Installation keine bekannten Schwachstellen.
- Anfragevalidierung, Produkte, KI-Anbindung und Wochenplanung: siehe aktuellen Fortschritt unten. Benutzerkonten aus Schritt 7 auf Nutzerwunsch vorgezogen und implementiert; weitere Account-Funktionen bleiben außerhalb der aktuellen Version.

- Struktur angepasst: Backend-Dateien einschließlich installierter Abhängigkeiten und Build-Ausgabe nach `Backend/` verschoben; Startanleitungen und Projektanweisungen aktualisiert.

- Lokale `Backend/.env` angelegt: HTTP-Port 3000, MongoDB-Port 27027 mit passender lokaler URI; Gemini-Schlüssel bleibt bis zur Anbindung leer. Datei ist durch .gitignore ausgeschlossen. Compose-Konfiguration geprüft.

## Authentifizierung – implementiert

- Auf Nutzerwunsch vor Nutzerprofilen umgesetzt: einfache Registrierung und Login, ohne E-Mail.
- Endpunkte: POST `/api/auth/register`, POST `/api/auth/login`, GET `/api/auth/me` (Bearer-Token erforderlich).
- Namen: 3–30 Zeichen aus a-z, Zahlen, Unterstrich und Bindestrich, getrimmt und kleingeschrieben. Eindeutiger MongoDB-Index vor Annahme von Anfragen initialisiert; doppelte Registrierung liefert 409.
- Passwörter: 8–128 Zeichen; scrypt mit zufälligem Salt und zeitkonstantem Hashvergleich. Passwort-Hashes werden weder in Antworten ausgegeben noch standardmäßig durch Mongoose selektiert.
- JWT: HS256, Gültigkeit eine Stunde, fester Issuer/Audience, Benutzer wird bei geschützten Anfragen erneut aus MongoDB geladen. Fehlende, manipulierte und abgelaufene Tokens liefern 401.
- Globale DTO-Validierung weist zusätzliche Felder ab. Registrierung und Login jeweils auf 20 Anfragen pro Minute/IP/Backend-Instanz begrenzt (429).
- Zufälliges JWT_SECRET in vorhandener lokaler .env ergänzt, ohne vorhandene Einstellungen zu überschreiben oder den Schlüssel auszugeben. Startvalidierung verlangt mindestens 32 Zeichen; Compose reicht den Schlüssel weiter.
- Geprüft: TypeScript, Build, sieben automatisierte Tests, Compose-Konfiguration, Docker-Build und Integrationstest gegen echte MongoDB. Integration bestätigt Eingabevalidierung, parallele Registrierung (201/409), Login, geschützten Benutzer, einheitliche Fehler bei falschem Passwort/unbekanntem Benutzer, ungültige/abgelaufene/falsch signierte Tokens und falschen Issuer sowie Login-Limit. Hash-Speicherung und eindeutiger Datenbankindex zusätzlich geprüft.
- Auth-Teststack `smartspoon-auth-verification` samt eigenem Testvolume vollständig entfernt; bestehende Anwendungsdaten unverändert.
- Kein Refresh-Token, Passwort-Reset oder serverseitiger Token-Widerruf in dieser Version. Weitere private Endpunkte sollen den AuthGuard nutzen und Nutzerdaten dem authentifizierten Benutzer zuordnen.

## Geburtsdatum – implementiert

- Registrierung verlangt zusätzlich `birthDate` im Format YYYY-MM-DD. Separate RegisterDto; Login verlangt weiterhin nur Benutzername und Passwort.
- Validierung prüft echte Kalenderdaten, einschließlich Schaltjahre, und verbietet Zukunftsdaten anhand des Kalendertags in Europe/Berlin.
- Speicherung als Datum ohne Uhrzeit (String), damit keine Zeitzonenverschiebung des Geburtstags entsteht. Registrierung, Login und `/api/auth/me` geben birthDate zurück. Das Datum wird nicht in den JWT aufgenommen.
- Bestandskonten ohne Geburtsdatum bleiben anmeldbar und liefern birthDate: null. Es werden keine Geburtstage erfunden. Eine spätere Kontobearbeitung kann fehlende Angaben ergänzen.
- Das aktuelle Alter wird jetzt aus dem Geburtsdatum abgeleitet und an Gemini übergeben; das vollständige Geburtsdatum wird nicht an Gemini gesendet.
- Geprüft: TypeScript und Build, zehn automatisierte Tests, Docker-Build, erweiterter HTTP-Integrationstest mit ungültigen/fehlenden/zukünftigen Datumsangaben und Datum in allen Benutzerantworten. Speicherung als String und Login eines Bestandskontos ohne Datum gegen echte MongoDB geprüft. Isolierten Teststack samt Testvolume entfernt.

## Rezeptparameter und Produktkatalog – aktueller Stand

- Nutzerentscheidung: Budget, Supermarkt, Personenanzahl, Lebenssituation, Ernährung, Allergien und Kochzeit bei jeder Anfrage erneut eingeben; keine Speicherung im Benutzerprofil. Die frühere Planung eines profiles-Moduls wurde verworfen. Benutzerkonto enthält Benutzername, Passwort-Hash und Geburtsdatum.
- Produkte/Testpreise abgeschlossen: products-Modul mit MongoDB/Mongoose, stabile Kennungen und eindeutiger Index, Packungsmenge in g/ml/piece und positive ganze Centbeträge pro gekaufter Packung.
- 36 ausdrücklich fiktive Testprodukte, zwölf je REWE/Aldi/Lidl; sourceLabel kennzeichnet Testdaten, priceType=test. Quelle-URL, Filiale und reales Erhebungsdatum bleiben null. Keine echten Preise recherchiert oder behauptet.
- Geschützte Endpunkte: GET `/api/products`, optional mit supermarket, limit (1–100) und offset (0–100000); GET `/api/products/supermarkets`; GET `/api/products/:id`. Listenantwort enthält Daten, Gesamtanzahl, Seiteneinteilung und Testpreis-Hinweis. Keine öffentliche Schreib-API.
- Seed bewusst nur per ausdrücklichem Befehl: lokal `npm run seed:products`; im laufenden Docker-Backend `node dist/scripts/seed-products.js`. Legt fehlende Testprodukte an, überschreibt keine bestehenden Produkte oder Nutzer und läuft nicht automatisch beim Start.
- Geprüft: TypeScript, Build, 13 automatisierte Tests, Compose-Konfiguration, Docker-Build und HTTP-Integration mit echter MongoDB. Seed zuerst 36 neue Produkte, bei Wiederholung 0 neue/36 bestehende. HTTP-Test bestätigt Authentifizierung, Supermarktfilter, Seiteneinteilung, Detailabfrage, fehlende/ungültige IDs, ungültige oder zusätzliche Query-Parameter, Testpreis-Markierung und Swagger-Schemas.
- Separaten Teststack `smartspoon-products-verification` mit Ports 3109/27029 samt Testvolume entfernt. Testprodukte nicht in die normale Anwendungsdatenbank eingespielt; Start- und Seed-Befehle stehen in Backend/README.md.
- Anfrage-DTO, Gemini-Anbindung, Rezeptauswahl, Einkaufsliste und Budgetprüfung sind inzwischen implementiert (siehe unten). Vollständige Wochenplanung ist noch offen.

## Rezeptanfrage und Gemini – implementiert

- POST `/api/recipes/generate` mit Bearer-Token. Pro Anfrage: supermarket, weeklyBudgetCents, persons, lifeSituation, diet, allergies, excludedIngredients, maxCookingTimeMinutes und recipeCount (1–7, Standard 3). Globale DTO-Validierung begrenzt Zahlen, Listen und erlaubte Kennungen; fremde Benutzer-IDs oder weitere Felder werden abgewiesen.
- Kein Speichern der Eingaben im Benutzerprofil und aktuell auch keine Speicherung der Rezeptauswahl. Nutzerkonto wird nur gelesen. Ein vollständiger Wochenkalender mit allen Mahlzeiten bleibt ein späterer Schritt.
- products-Katalog um ingredientKey, dietaryTags und allergens ergänzt. Neue Testdaten enthalten diese Felder. Seed ergänzt ausschließlich fehlende Metadaten älterer identischer Testprodukte; Preise, Packungsmengen und vorhandene Metadaten bleiben unverändert.
- Server filtert Produkte nach Supermarkt, Ernährungsweise, Allergenen und Zutaten-Ausschlüssen, bevor die KI aufgerufen wird. Produkte ohne Metadaten werden ausgeschlossen. Herstellerangaben/Spuren sind im fiktiven Testkatalog nicht enthalten. Prüfung betrifft strukturierte Zutaten, keine semantische Garantie für freie Kochtexte.
- Alter aus Geburtsdatum mit Kalendertag Europe/Berlin; nur Alter (oder null) an Gemini, kein Geburtsdatum, Benutzername, Benutzer-ID oder Passwort.
- Austauschbarer RecipeProvider; GeminiProvider nutzt offizielles @google/genai-SDK, strukturelles OpenAPI-Schema über responseSchema und strenge Zod-Antwortvalidierung. Standard gemini-3.5-flash-lite gemäß aktueller offizieller Preisseite, per GEMINI_MODEL konfigurierbar. Keine Websuche und keine erfundenen KI-Preise.
- BudgetService prüft Produkt-IDs, Einheiten, Rezeptanzahl, Portionen und Kochzeit. Summiert Mengen über alle Rezepte, rundet auf ganze Packungen auf und berechnet ganze Centbeträge, Einkaufsliste, Restmengen und verbleibendes Budget.
- Maximal eine fachliche Korrektur, insgesamt höchstens zwei KI-Aufrufe. Leere, unzulässige oder dauerhaft über Budget liegende Auswahl wird nicht als Erfolg ausgegeben. SDK-Zeitlimit 30 Sekunden pro Aufruf, keine automatischen SDK-Wiederholungen. Lokal fünf Anfragen/Minute/IP/Backend-Instanz.
- GEMINI_MODEL in bestehender .env ergänzt. Nutzer hat inzwischen GEMINI_API_KEY gesetzt; der laufende Container lädt denselben Schlüssel. Compose gibt beide Werte weiter. Übriges Backend startet ohne Schlüssel, Rezeptgenerierung liefert bei vorhandenem Katalog ohne Schlüssel 503.
- Geprüft: TypeScript, Build, 27 automatisierte Tests, Compose-Konfiguration, Docker-Image und gesunde Testcontainer. Integration gegen echte MongoDB und tatsächliches Gemini-SDK mit lokalem Mockserver bestätigt HTTP-Validierung, Authentifizierung, Ernährungs-/Allergen-/Zutatenfilter, Paketaggregation und Budget, eine Korrektur, ungültige Antwort (502), Provider-Kontingent (503), fehlenden Schlüssel (503), lokale Begrenzung (429) sowie Swagger-Antwortschemas. Nutzerdokument nach Anfrage unverändert.
- Integration prüft Seed-Metadatenmigration: 35 neue Produkte plus drei ergänzte Metadatenfelder an einem alten Testprodukt, dessen geänderter Preis unverändert bleibt. Erneuter Seed erzeugt weder Duplikate noch erneute Metadatenänderungen.
- Teststack `smartspoon-recipes-verification` (Ports 3110/27030) samt Testvolume entfernt; normale Anwendungsdatenbank unverändert. Keine externen KI-Aufrufe im Test.
- Live-Prüfung mit eigenem Schlüssel: Datenbank bereit, zwölf REWE-Testprodukte mit Metadaten vorhanden. Modellliste erfolgreich; gemini-3.5-flash-lite verfügbar. Minimale Textgenerierung antwortet erfolgreich mit OK. Echte POST-Rezeptanfrage liefert jedoch 502; direkter Schema-Test liefert upstream 400 INVALID_ARGUMENT, auch mit reduziertem Schema. Weitere Minimaltests liefern 503 (hohe Nachfrage) bzw. 504 (Zeitlimit). Schlüssel funktioniert, vollständige Rezeptgenerierung ist noch nicht erfolgreich bestätigt; Ursache der Schema-Ablehnung bleibt offen. Temporären Testnutzer wieder gelöscht; keine Geheimnisse ausgegeben.
- Schema-Kompatibilität behoben: responseJsonSchema durch responseSchema mit Gemini-Typen und Pflichtfeldern ersetzt. Vollständiges Schema mit Grenzen wurde auch dort mit 400 abgelehnt; strukturelles Schema ohne Werte-/Längengrenzen funktioniert. Grenzen, unbekannte Felder, Produkt-IDs und fachliche Vorgaben bleiben unverändert lokal durch Zod und BudgetService abgesichert. Keine automatische Ausweichanfrage und keine zusätzlichen SDK-Wiederholungen.
- Geprüft nach Korrektur: Build und alle 27 automatisierten Tests erfolgreich; HTTP-Integration mit echter MongoDB und tatsächlichem SDK gegen lokalen Mock erfolgreich. Isolierte Testdatenbank anschließend gelöscht. Docker-Backend neu gebaut und gestartet.
- Reale Rezeptgenerierung bestätigt: POST /api/recipes/generate liefert 200 in ca. 13,8 Sekunden. Eingabe REWE, 4000 Cent, eine Person, Student, vegan, Gluten ausgeschlossen, Milch ausgeschlossen, maximal 30 Minuten und drei Rezepte. Ergebnis: Linsen Reis Pfanne (25 Min.), Karotten Kartoffel Eintopf (30 Min.), Tomaten Linsen Suppe (20 Min.). Ganze Kaufpackungen kosten 1303 Cent, Restbudget 2697 Cent, priceType=test. Rezeptanzahl, Portionen, Kochzeit, veganer/glutenfreier Produktkatalog und Preisaggregation zusätzlich im Live-Test geprüft. Temporären Testnutzer gelöscht; keine Geheimnisse ausgegeben.
- Nächster Schritt: vollständige Wochenplanung/optional gespeicherte Ergebnisse nach gewünschtem Umfang. Reale Supermarktpreise bleiben ein eigener Schritt.

## Angular-Frontend – Planung

- Nutzer möchte zuerst Architektur und Plan festlegen; noch kein Frontend-Code erstellt.
- Architektur, Bedienablauf und Umsetzungsschritte stehen in `docs/FRONTEND_PLAN.md`.
- Geplant: Standalone Angular mit TypeScript, Material/CDK und SCSS, Reactive Forms, Signals, HttpClient und Feature-Struktur. Erste Version nutzt bestehende Auth- und Rezept-API.
- Rezeptparameter und Ergebnisse nur temporär im Arbeitsspeicher; keine Speicherung im Profil. Bestehende Bearer-Authentifizierung tabbezogen über sessionStorage, einschließlich Ablaufbehandlung und Logout.
- Nächster Frontend-Schritt: Grundgerüst unter `Frontend/`, Routing, Gestaltung und Entwicklungsproxy; anschließend Auth, Anfrageformular und Rezept-/Einkaufsansicht.

## Angular-Frontend – Schritt 1 abgeschlossen

- Grundgerüst unter Frontend/ mit Angular/Material/CDK 22.2.2, TypeScript 6 und Strict-Modus erstellt. Node 24.15 kompatibel. Responsive Startseite, App-Rahmen, SCSS-Gestaltung und lazy geladene Navigation implementiert.
- Öffentliche Vorschauseiten für Anmeldung, Registrierung und Rezeptanfrage; noch keine Auth- oder Formularfunktionen. Deutsche Locale, HttpClient und API-Konfiguration vorbereitet. Entwicklungsproxy /api/** → Backend-Port 3000.
- Produktionsbuild und TypeScript-Prüfung erfolgreich. Navigation, direktes Neuladen, unbekannte URLs, Tastatursprunglink und Fokusführung im Browser geprüft; responsive Darstellung bei 320–1440 Pixeln ohne horizontales Überlaufen und visuell auf Desktop/Mobil geprüft. Proxy bestätigt Backend-Bereitschaft mit 200. Keine Browser-Laufzeitfehler im Abschlusslauf; npm-Audit ohne bekannte Schwachstellen.
- Startanleitungen in Frontend/README.md und Projekt-README ergänzt. Entwicklungsserver läuft auf 127.0.0.1:4200. Nächster Schritt: Authentifizierung im Frontend.

## Frontend-Komponentenstruktur – festgelegt

- Jede Komponente besitzt einen eigenen Ordner mit separaten .ts-, .html- und .scss-Dateien; keine Inline-Templates oder Inline-Styles. Regel in AGENTS.md und Frontend-Plan dokumentiert.
- Root-Komponente nach app/app/, AppShell nach layout/app-shell/, HomePage nach features/home/home-page/ und UpcomingPage nach shared/ui/up-coming/ verschoben. Inline-Template/Styles ausgelagert und Imports aktualisiert.
- Angular-Generator auf flat=false, inlineTemplate=false und inlineStyle=false eingestellt. TypeScript-Prüfung und Produktionsbuild erfolgreich; alle bestehenden Komponenten haben die drei Dateien.

## Angular-Frontend – Schritt 2 abgeschlossen

- Echte Registrierung und Anmeldung über die bestehende Backend-API, Reactive Forms mit Benutzername/Passwort/Geburtsdatum, Passwortanzeige und verständlicher Validierung. AuthPage besitzt eigenen Ordner mit separaten TS-, HTML- und SCSS-Dateien.
- SessionStore/Signals, AuthService, AuthApi, funktionaler Interceptor und Guards implementiert. Token nur tabbezogen in sessionStorage; Sitzungsprüfung über /auth/me nach Neuladen, Ablauf anhand JWT exp, Logout und geschützte Rezeptseite. Keine Passwörter oder Rezeptparameter persistiert.
- Token bleibt auf eigener API; keine Bearer-Header an externe URLs oder Auth-Login/Register. Aktuelle geschützte 401 löscht Sitzung; späte Antworten alter Sitzungen überschreiben keine neue Sitzung. Verbindungsausfälle erlauben manuelle Wiederholung ohne automatische erneute Auth-Anfrage. HTTP-Zeitlimit zehn Sekunden.
- Build, Strict-TypeScript-Prüfung und 16 gezielte Vitest-Tests erfolgreich. Browser gegen echtes Backend bestätigt Registrierung, Login, falsches Passwort, doppelten Namen, Sitzungswiederherstellung und Logout. Browser-Mocks bestätigen ungültige Sitzung, Limits, Verbindungsausfälle und manuelle Sitzungsprüfung. Mobile Breiten 320–1440 ohne horizontales Überlaufen; Fokusführung und mehrzeilige Fehlermeldungen geprüft. Keine Browser-Laufzeitfehler im Abschlusslauf; temporären Testnutzer gelöscht. Keine Gemini-Anfragen für diesen Schritt.
- README und Frontend-Plan aktualisiert. Nächster Schritt: geführte Rezeptanfrage; /rezepte zeigt bis dahin eine geschützte Vorschau.

## Angular-Frontend – Schritt 3 abgeschlossen

- Geführte Rezeptanfrage unter /rezepte in drei Schritten implementiert. RecipePage und RecipeResults besitzen eigene Ordner mit separaten TS-, HTML- und SCSS-Dateien. Supermärkte aus API; Ernährung, Allergien, Zutaten-Ausschlüsse und Lebenssituation mit deutschen Labels; Grenzen wie Backend.
- Exakte Budgetumrechnung aus Dezimalstring in Cent, keine Float-Rundung. RecipeApi und temporärer RecipeWorkspace; keine Profil- oder Browser-Persistenz von Rezeptparametern/Ergebnissen. Rücknavigation erhält Entwurf, neue Anfrage/Logout/Reload setzen zurück. Entwurf nach Ablauf nur für denselben Nutzer vorübergehend erhalten.
- POST /api/recipes/generate mit Ladezustand, gesperrtem Formular und Doppelklickschutz; 70 Sekunden Client-Zeitlimit, keine automatische Wiederholung. Fehler erhalten Eingaben. Laufende clientseitige Anfrage wird beim Verlassen der Seite oder Tokenwechsel abgebrochen; alte Ergebnisse werden nicht in neue Sitzungen übernommen.
- Erste Ergebnisansicht mit Rezeptkarten, aufklappbaren Zutaten/Kochschritten, Gesamtkosten und Restbudget. Preise sichtbar fiktive Testwerte; keine Behauptung eines vollständigen Wochenplans. Einkaufsliste zum Abhaken bleibt nächster Schritt.
- Geprüft: Build, Strict-TypeScript und 32 automatisierte Tests. Browser bestätigt alle Formularschritte, Navigation, validierte exakte Anfrage, Lade-/Fehlerzustände, Reset/Reload und ausschließlich Token in Browser-Speicher. Alle Schritte bei 320–1440 Pixeln ohne horizontales Überlaufen; Ergebnis visuell auf Desktop und Mobil geprüft, keine Laufzeitfehler.
- Reale Frontend→Backend→Gemini-Anfrage erfolgreich (200): drei vegane Rezepte aus Produkten ohne Gluten laut Test-Metadaten, REWE, Budget 4029 Cent, eine Person, Student, Milch ausgeschlossen, maximal 30 Minuten. Einkaufskosten 1303 Cent, Restbudget 2726 Cent. Temporären Testnutzer entfernt. Reguläre Tests nutzen Mock-HTTP.
- Nächster Schritt: Einkaufsliste mit Packungen, Einzelkosten, Restmengen und temporären Häkchen.

## Angular-Frontend – Schritt 4 abgeschlossen

- ShoppingList im eigenen Ordner mit separaten TS-, HTML- und SCSS-Dateien ergänzt. Zeigt benötigte Menge über alle Rezepte, ganze Packungen, Kaufmenge, Restmenge, Preis pro Packung, Artikelkosten und Gesamtkosten. Backend-Mengen und Centbeträge werden unverändert dargestellt; g/ml/Stück mit deutscher Zahlenformatierung.
- Zugängliche native Checkboxen und angekündigter Artikelzähler. Abhaken beeinflusst weder Kosten noch Restbudget. Häkchen ausschließlich im RecipeWorkspace-Arbeitsspeicher, bei interner Navigation erhalten; Angaben ändern/neue Auswahl/neue Anfrage/Ablauf/Logout/Reload löschen sie. Unbekannte Produkt-IDs werden ignoriert.
- Geprüft: Strict-TypeScript, Produktionsbuild und 35 automatisierte Tests bestanden. Browser mit Mock-API bestätigt Tastaturbedienung, Packungsmengen/Restmengen, unveränderte Kosten, Navigationserhalt und Reset bei neuer Auswahl/Reload. Breiten 320/390/768/1440 ohne horizontales Überlaufen; Desktop und Mobil visuell geprüft, keine Laufzeitfehler. Keine echten KI-Aufrufe oder neuen Nutzerkonten für diese Prüfung.
- Nächster Schritt: Docker-Einbindung des Frontends mit Reverse Proxy und gemeinsame Startanleitung; abschließende Prüfung des Gesamtflusses.

## Angular-Frontend – Schritt 5: Docker und Gesamtprüfung abgeschlossen

- Frontend/Dockerfile mit getrennten Node-24-Build-/Nginx-1.28-Laufzeitstufen sowie .dockerignore und nginx.conf ergänzt. Backend/compose.yaml um Frontend auf 127.0.0.1:8080 erweitert; FRONTEND_PORT in vorhandener .env und .env.example ergänzt. Bestehender Compose-Projektname und MongoDB-Volume erhalten.
- Nginx liefert statisches Angular und SPA-Fallback; /api wird unter Erhalt von Pfad, Bearer-Header und Fehlerstatus an backend:3000 weitergeleitet. Docker-DNS-Auflösung für neu erstellte Backend-Container, 75 Sekunden Proxy-Lesezeitlimit und keine automatischen Wiederholungen. API no-store, index no-cache, Fingerprint-Assets immutable; fehlende Assets liefern 404.
- Compose wartet auf Backend-Bereitschaft vor Frontend-Start. Frontend /healthz prüft Nginx; /api/health/ready Backend und MongoDB. Gemeinsame Startanleitungen und optionaler Port dokumentiert. Für lokale Angular-Entwicklung weiterhin Port 4200 und gezielter Start von backend/mongodb möglich.
- Geprüft: Compose-Konfiguration, mehrstufige Docker-Builds und Nginx-Syntax erfolgreich; alle drei Container healthy. Vier neue HTTP-Integrationstests (npm run test:docker) prüfen echte SPA-Routen, Assets/Cache, API-Fehler/Auth/Readiness und Swagger; auch nach erneutem Erstellen des Backend-Containers erfolgreich.
- Browser gegen Docker-Oberfläche bestätigt Registrierung, Formularvalidierung, Rücknavigation, Lade-/Fehlerzustände, mobile Breiten 320–1440 und Neuladen mit Session-Wiederherstellung. Echter Frontend→Nginx→NestJS→Gemini-Aufruf liefert 200: drei vegane Rezepte (Linsen-Karotten-Topf, Kartoffel-Karotten-Pfanne, Tomaten-Reis-Pfanne), REWE/Budget 4029 Cent, Gesamtkosten 1303 Cent, Restbudget 2726 Cent. Einkaufsliste abgehakt und visuell geprüft; keine Browser-Laufzeitfehler. Testnutzer anschließend gelöscht.
- Erste vereinbarte Frontend-Version vollständig implementiert. Reale Supermarktpreise und vollständige Wochenplanung bleiben eigene nächste fachliche Schritte; keine zusätzlichen Funktionen vorweggenommen.

## Prettier eingerichtet

- Frontend-CLI funktioniert; zuvor fehlten npm-Formatierungsbefehle und Workspace-Einstellungen. Prettier bislang nur im Frontend als npm-Abhängigkeit.
- Gemeinsame Root-Konfiguration und Ignore-Regeln, VS-Code-Standardformatter/Format-on-Save im Stamm und Frontend sowie Erweiterungsempfehlung ergänzt. Root-Workspace verwendet das lokale Frontend-Prettier auch für Backend-Dateien. npm run format und format:check im Frontend ergänzt. Keine pauschale Umformatierung der bestehenden Codebasis.
- Geprüft: lokale Prettier-Aufrufe und Konfigurationsauflösung für Backend-TypeScript/Angular-HTML erfolgreich; neue JSON-Konfigurationen bestehen prettier --check. format:check meldet erwartungsgemäß 46 noch nicht formatierte Bestandsdateien, keine Parserfehler. Ob die Editor-Erweiterung installiert/aktiviert ist, ist hier nicht nachgewiesen.
- Gemeldeten index.mjs-Ladefehler geprüft: Datei vorhanden, Laden über index.cjs und Formatieren erfolgreich; installierte VS-Code-Erweiterung 12.4.0. Fehler hier nicht reproduzierbar; Editor-Neuladen als nächster Diagnoseschritt, keine unnötige Neuinstallation oder Versionsänderung.

## Frontend-Refactoring – Tailwind statt Angular Material

- Auf Nutzerwunsch bestehendes Design erhalten und Angular Material/CDK vollständig aus Dependencies, Imports, Templates und globalem Theme entfernt. Tailwind CSS und @tailwindcss/postcss 4.3.3 mit PostCSS integriert, Docker-Build angepasst. Keine Änderungen am Backend-Vertrag oder an Profil-/Rezeptpersistenz.
- src/tailwind.css enthält gemeinsame Farben, Buttons und Outline-Formularfelder über Tailwind; vorhandene Seitenlayouts und besondere Gestaltung bleiben in SCSS. Kein Preflight-Reset, bestehende globale Regeln in base-Layer. Separate TS/HTML/SCSS-Dateien pro Komponente bleiben verbindlich.
- Native Inputs/Selects mit expliziten Labels, ARIA-Fehler-/Hinweiszuordnungen und Validierung erst nach Berührung. Neue shared/ui/multi-select-Komponente mit ControlValueAccessor, Checkboxen, sichtbarer Auswahl, Escape/Fokus-Rückgabe, Außenklick/Fokuswechsel und disabled-Unterstützung ersetzt Material-Mehrfachauswahl. Rezeptanzahl via ngValue weiterhin numerisch.
- Bereits verschobene Auth-Modelle/Guards/Interceptor berücksichtigt: veraltete Imports in Services und Tests an vorhandene shared-Struktur angepasst. Keine Rückverschiebung der Nutzerstruktur.
- Geprüft: Strict-TypeScript, Produktionsbuild und 38 Tests erfolgreich, darunter drei neue Mehrfachauswahl-Tests. Browser-Mock-API bestätigt Auswahl von Allergien/Zutaten, Rezeptablauf/Einkaufsliste, Checkbox-Tastaturbedienung, Navigation/Reset, Login-/Registrierungsvalidierung, Passwortanzeige und Fehlererhalt. Start/Auth/Ergebnis bei 320/390/768/1440 ohne Überlaufen; Desktopansichten visuell geprüft, keine Laufzeitfehler. Keine echten Gemini-Aufrufe für diese Umstellung.
- Docker-Image mit PostCSS-Konfiguration erfolgreich gebaut, alle Dienste healthy.
- Abschlussprüfung: vier Docker-HTTP-Integrationstests und Browserablauf gegen den Tailwind-Produktionsbuild erfolgreich. Mehrfachauswahl auch vollständig per Tastatur geprüft; Essenswünsche-Ansicht ebenfalls bei 320–1440 Pixeln ohne Überlaufen und mobil visuell geprüft.

## Gespeicherte Rezeptauswahlen – Backend implementiert

- Eigenes saved-recipes-Modul mit MongoDB-Collection, Eigentümer-, Zeit- und eindeutigen Generierungsindizes. POST /api/saved-recipes speichert die vollständige Auswahl; GET Liste/Details und DELETE ausschließlich eigene Auswahlen. Liste paginiert (20, maximal 50), neueste zuerst; fremde und fehlende IDs gleichermaßen 404. Benutzer-ID nur aus AuthGuard.
- Generierung ergänzt saveProof: 24 Stunden gültiger HS256-Nachweis mit eigener Audience, Nutzerbindung, Generierungs-ID und SHA256-Hash des kanonischen Ergebnisses. Keine Persistenz bei Generierung. POST nimmt die unveränderte Generierungsantwort entgegen; Preise/Rezepte/Mengen können nicht manipuliert oder von fremden Nutzern gespeichert werden. Kein neuer KI-Aufruf oder erneute Produktpreisberechnung beim Speichern.
- Dauerhafte Momentaufnahme mit Rezepten/Zutaten/Kochschritten, vollständigen Produktdetails/Quellenkennzeichnung, Packungen/Mengen/Resten, Centpreisen/Gesamt-/Restbudget und optionalen anfänglichen Artikelhäkchen. Signierter Nachweis, Geburtsdatum und Anfrageparameter werden nicht zusätzlich gespeichert; Profil unverändert. Testpreise bleiben ausdrücklich Testpreise.
- Optionaler Titel (1–120 Zeichen nach Trim), Häkchen nur aus zugehöriger Einkaufsliste. Gleichzeitige/wiederholte Speicheranfragen derselben Generierung liefern dieselbe ID; erste Metadaten bleiben erhalten. Gespeicherte Ergebnisse haben kein Ablaufdatum und hängen nicht mehr vom Produktkatalog ab. Abgelaufener Speichernachweis betrifft nur das erstmalige Speichern.
- Geprüft: TypeScript, Build und 31 automatisierte Tests bestanden. Zusätzliche HTTP-Integration mit echter isolierter MongoDB und Mock-KI bestätigt keine automatische Speicherung, Nutzerschutz, Manipulations-/DTO-Abweisung, gleichzeitiges Speichern ohne Duplikate, Seiteneinteilung, vollständige Wiederherstellung über eine neue DB-Verbindung, unveränderte Ergebnisse nach Produktlöschung, unverändertes Benutzerprofil und Löschung. Testdatenbanken anschließend gelöscht, keine echten KI-Aufrufe.
- Backend-Docker-Image aktualisiert und healthy; Reverse-Proxy bestätigt Readiness 200, Speicher-Endpunkt ohne Auth 401 und neue Swagger-Routen. API-Vertrag in Backend/README.md dokumentiert.
- Nächster Schritt: Speichern-Button und Ansicht für gespeicherte Auswahlen im Frontend; Frontend in diesem Schritt nicht verändert.

## Gespeicherte Rezeptauswahlen – Frontend implementiert

- SaveSelection im eigenen TS/HTML/SCSS-Ordner ergänzt: Name, explizites Speichern kompletter Antwort einschließlich saveProof und aktuellem Häkchenstand, Lade-/Erfolgs-/Fehlerzustände und Link zur gespeicherten Auswahl. Keine Rekonstruktion signierter Daten, keine automatische Speicherung oder erneute KI-Anfrage. Fehlender Nachweis bei alten Ergebnissen erklärt.
- Neues lazy geladenes saved-recipes-Feature unter /gespeichert und /gespeichert/:id, AuthGuard und Navigationslink. Übersicht mit Datum, Titeln, Kosten, leerem Zustand und Seiteneinteilung; vollständige Detailansicht wiederverwendet RecipeResults/ShoppingList und lädt gespeicherte Häkchen. Neue Häkchenänderungen ausdrücklich nur lokal.
- Native Löschbestätigung mit Fokusführung, Abbrechen/Escape, gesperrtem laufendem Löschen und Fehler-/Retry-Zustand. Erfolgreiches Löschen aktualisiert Übersicht und lokalen Speicherstatus; Löschen letzter Einträge berücksichtigt vorherige Seite. Fehlende Auswahl und Verbindungsfehler mit manueller Wiederholung.
- SavedRecipesApi mit zehn Sekunden Zeitlimit, Root-Speicherstatus nur für aktuelle Generierung, seitenbezogener SavedRecipesStore. Token-/Resultwechsel und zerstörte Ansichten brechen alte Requests ab; keine alten Daten in neuen Konten. Sichere Login-Rückkehr um gespeicherte Routen erweitert. Neue Anfrage aus gespeicherter Ansicht setzt den temporären Entwurf zurück.
- Geprüft: TypeScript und Produktionsbuild; 49 Frontend-Tests einschließlich unveränderter/erweiterter Snapshot-Payloads, Doppelklickschutz, echtem Formular-Submit ohne Reload, Fehler-/Timeout-Retry, Sitzungswechsel, Häkchen-Wiederherstellung, Pagination/Löschung und sicheren Rückkehrpfaden.
- Browser mit realem Backend/Gemini bestätigt Generierung 200, explizites Speichern, vollständiges Öffnen/Neuladen und persistierten Häkchenstand, Übersicht/Leerzustand, Löschbestätigung, Löschen und Guard. Mock-503 bei Speichern/Löschen erhält Daten und erlaubt manuelle Wiederholung. Ansichten bei 320/390/768/1440 ohne Überlaufen, Desktop/Mobil visuell geprüft, keine Laufzeitfehler. Temporären Nutzer und seine gespeicherten Auswahlen gelöscht.
- Abschlussprüfung: aktualisiertes Frontend-Docker-Image gebaut, alle Dienste healthy. Vier Docker-HTTP-Integrationstests einschließlich gespeicherter SPA-Routen erfolgreich; Browserablauf mit Mock-API gegen den Produktionsbuild bestätigt Speichern, Öffnen, Neuladen und Löschen ohne Laufzeitfehler.

## Refactoring und GitHub CI/CD – 9. Oktober 2026

- Nutzerentscheidung: vorerst keine neuen Features; Frontend und Backend schrittweise refaktorieren. Zunächst GitHub und CI/CD vorbereiten.
- CI-Workflow mit getrennten Backend-/Frontend-Prüfungen, MongoDB-HTTP-Integration mit Mock-KI und nachgelagertem Docker-Gesamtstack ergänzt. Keine echten Gemini-Aufrufe oder Deployment-Secrets.
- CD vorerst nur in docs/CI_CD.md festgelegt: versionierte Release-Images, später manuelle Freigabe und Deployment unveränderlicher Images; Hosting noch offen. Kein aktiver CD-Workflow.
- Beim Start dieses Schritts existieren weder lokales Git-Repository noch Remote. GitHub-URL angefragt; Push und erster GitHub-Lauf noch ausstehend.
- Lokal geprüft: Workflow-YAML lesbar, beide TypeScript-Prüfungen und Builds erfolgreich, 31 Backend- und 49 Frontend-Tests sowie MongoDB-HTTP-Integration bestanden. Isolierter CI-Docker-Stack healthy; vier HTTP-Prüfungen bestanden. Testdatenbank und Teststack samt Testvolume entfernt. Git auf main initialisiert; Ignore-Regeln bestätigt und einfache Prüfung auf Schlüssel-/Token-/Private-Key-Muster ohne Treffer.

## Projektname SmartSpoon – 9. Oktober 2026

- Projekt und App auf Nutzerwunsch in SmartSpoon umbenannt: Oberfläche/SEO/Seitentitel, API/Health, npm-Pakete und Lockfiles, Angular-Projekt/Buildpfad, Nginx und CI-/Testnamen.
- JWT-Issuer/Audiences und Session-Key ebenfalls umbenannt; erneute Anmeldung erforderlich. Alte ungespeicherte Generierungen benötigen einen neuen Speichernachweis. Bereits gespeicherte Auswahlen bleiben erhalten.
- Physische MongoDB-Datenbank kochfaul und vorhandenes Volume kochfaul_mongodb_data aus Kompatibilitätsgründen erhalten. CI erhält explizit ein eigenes Volume, damit Cleanup niemals Anwendungsdaten entfernt.
- Geprüft: beide TypeScript-Prüfungen und Builds, 31 Backend- und 49 Frontend-Tests, MongoDB-HTTP-Integration sowie vier Docker-HTTP-Tests bestanden. Neue Images gebaut und alle SmartSpoon-Dienste healthy; HTML, Health und Swagger tragen den neuen Namen. Vorhandenes Datenvolume per Container-Mount bestätigt. Projektordner ebenfalls in SmartSpoon umbenannt; GitHub-Remote weiterhin nicht gesetzt.

## Frontend-Refactoring – konsequente Tailwind-Nutzung, 9. Oktober 2026

- 1.406 Zeilen Komponenten-SCSS durch Tailwind-Utilities ersetzt; eigene Komponentenordner und separate Dateien beibehalten. Layout, Abstände, responsive Anpassungen und Zustände direkt in Templates; Host-Layout über statische Tailwind-Klassen. Keine Backend- oder Produktänderungen.
- Tailwind-Preflight aktiviert. Zentrales @theme mit Farben, Typografie inklusive fluiden Überschriften, Radien, Content-Breite und bisherigen Layout-Breakpoints. Gemeinsame Buttons/Formularfelder als begrenzte @apply-Komponenten; page-container als wiederverwendbare Utility. Keine doppelte CSS-Variablenpalette.
- Aktive Navigation über ARIA-Varianten, Wizard-Schritte über group-aria, Einkaufsartikel über has-checked/group-has-checked. Fokus/Fehler/disabled/Backdrop und reduzierte Animation als Tailwind-Varianten. Dialog nach Preflight explizit zentriert.
- prettier-plugin-tailwindcss in beiden vorhandenen Prettier-Konfigurationen mit Stylesheet-Verweis integriert; Tailwind IntelliSense empfohlen. Styling-Regeln in docs/FRONTEND_STYLING.md dokumentiert.
- Geprüft: TypeScript, alle 49 bestehenden Frontend-Tests und Produktionsbuild erfolgreich. Browservergleich mit bisherigem Docker-Stand: Start/Auth/404, alle Wizard-Schritte inklusive Mehrfachauswahl, Ergebnis/Einkaufsliste, gespeicherte Übersicht/Details und Löschdialog bei 320/390/768/1440 ohne Überlaufen oder Laufzeitfehler. Speichern/Neuladen/Häkchen-Wiederherstellung/Löschen mit Mock-API bestätigt, keine echten KI-Aufrufe. Desktop und Mobil visuell geprüft.
- Abschluss: alle Template-Klassen gegen das Tailwind-Designsystem geprüft (keine unbekannten Utilities); Prettier-Check für geänderte HTML-/Style-Konfiguration bestanden. Finales Frontend-Docker-Image gebaut und healthy, vier HTTP-Integrationstests sowie vollständiger Browserablauf gegen den Produktionsbuild bestanden.

## Komponenten-Refaktorierung (9. Oktober 2026)

- Branch `refactor-components`: Auth-, Start-, Rezept- und gespeicherte Rezeptseiten in Präsentationskomponenten unter `features/<feature>/components/<name>/` aufgeteilt. Jede Komponente besitzt separate TypeScript-, HTML- und SCSS-Dateien.
- Auth: Einführung, Sitzungshinweise, Formular sowie Benutzername, Passwort und Geburtsdatum. Rezepte: Einkauf, Ernährung, Prüfung und Zusammenfassung; bestehende Ergebnis-, Speicher- und Einkaufslistenkomponenten verschoben. Gespeicherte Rezepte: Liste, Karte, Detail und Löschdialog.
- Seiten behalten Formular- und NgRx-Orchestrierung; Kinder erhalten Inputs und melden Aktionen über Outputs. Tailwind-Gestaltung und DE/EN-Übersetzungen beibehalten.
- Prüfungen: Produktionsbuild, Anwendungstypprüfung, Spec-Typprüfung und 16 bestehende Tests erfolgreich. Lokale Browserprüfung mit gemockter API: DE/EN-Rezeptablauf, Speichern/Öffnen/Neuladen/Löschen, Sprachenwechsel, Auth-Fehler, Registrierung, Validierungsanzeigen, Fokus und Passwortanzeige. Kein horizontaler Überlauf bei 320/390/768/1440 Pixeln. Keine neuen Store-Tests.
