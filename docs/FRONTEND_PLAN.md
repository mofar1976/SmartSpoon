# SmartSpoon – Frontend-Architektur und Umsetzung

Stand: 8. Oktober 2026. Schritte 1–5 implementiert; erste Frontend-Version abgeschlossen.

## Ziel und Umfang

Angular-Anwendung im Ordner `Frontend/`, getrennt vom NestJS-Backend. Erste Version: Registrierung, Login, neue Rezeptanfrage, Rezeptansicht und Einkaufsliste. Die bestehende API liefert Rezeptauswahlen, keinen vollständigen Wochenkalender. Gespeicherte Auswahlen sind inzwischen implementiert; Favoriten und Kontobearbeitung bleiben spätere Erweiterungen.

## Architektur

- Aktuelle stabile Angular-Version beim Projektstart prüfen; TypeScript im Strict-Modus, Standalone-Komponenten und Angular Router mit lazy geladenen Features.
- Browser-Anwendung ohne SSR für die erste Version.
- Tailwind CSS/PostCSS für gemeinsame UI-Gestaltung; native Formulare und eigene zugängliche Mehrfachauswahl. Utility-Layouts in Templates und zentrale Tailwind-Theme-Tokens; Preflight aktiviert. Angular Material/CDK entfernt.
- Typisierte Reactive Forms für Registrierung und Rezeptparameter. Signals für Benutzerstatus, Ladezustände und temporäre Ergebnisse; HttpClient/RxJS für API-Anfragen. Feature-Services kapseln Abläufe. Zunächst kein zusätzlicher globaler Store.
- API-Typen anhand des bestehenden OpenAPI-Vertrags. Backend entscheidet über Berechtigungen, gültige Produkte und Kosten; Frontend stellt Ergebnisse dar und validiert Eingaben für unmittelbares Feedback.

Geplante Struktur:

```text
Frontend/src/app/
  core/                    # Auth-Session, HTTP-Interceptor, Guard, API-Konfiguration
  layout/                  # App-Rahmen und Navigation
  shared/                  # Wiederverwendbare UI und Formatierung
  features/
    auth/                  # Login, Registrierung und Auth-API
    recipes/               # Anfrageformular, Ergebnis, Einkaufsliste und Recipe-API
```

Keine direkten HTTP-Aufrufe aus Präsentationskomponenten. Fachliche Komponenten bleiben im jeweiligen Feature; shared enthält nur tatsächlich wiederverwendete Teile.

## Navigation und Ablauf

- `/`: kompakte Einführung mit Zugang zur Rezeptanfrage.
- `/anmelden`, `/registrieren`: öffentliche Auth-Seiten.
- `/rezepte`: geschützter Arbeitsbereich; Eingabe, Generierung und Ergebnis als Zustände desselben Features.
- Registrierung mit Benutzername, Passwort und Geburtsdatum; Login nur mit Benutzername und Passwort. Passwort sichtbar schalten, Autocomplete und verständliche Validierung. BirthDate als Datum ohne Zeitzonenumrechnung übertragen.
- Rezeptformular mit drei Schritten: (1) Supermarkt, Budget in Euro, Personen und Lebenssituation; (2) Ernährungsweise, Allergien, ausgeschlossene Zutaten und maximale Kochzeit; (3) Anzahl Rezepte und Zusammenfassung mit Aktion „Rezepte erstellen“.
- Beim Zurückgehen bleiben Eingaben im aktuellen Entwurf erhalten. Jede ausdrücklich neue Anfrage startet einen neuen Entwurf; keine Profil-, Server- oder Browser-Persistenz der Rezeptparameter.
- Budgeteingabe akzeptiert deutsche Dezimalschreibweise und wird vor der Anfrage exakt in ganze Cent umgewandelt. Gleiche Grenzen und Kennungen wie im Backend; Beschriftungen auf Deutsch.
- Generierung zeigt eine verständliche Wartemeldung; kein erfundener Fortschrittsprozentsatz. Absenden gegen Doppelklick sperren. Keine automatischen Wiederholungen kostenpflichtiger/KI-Anfragen.
- Ergebnis: Gesamtkosten, verbleibendes Budget, Portionen, Kochzeiten, Zutaten und nummerierte Kochschritte. Einkaufsliste zeigt benötigte Mengen, ganze Packungen, Preise und Reste; Artikel temporär abhaken. Preise sichtbar als fiktive Testpreise kennzeichnen. Keine Aussage, dass die ausgewählten Rezepte alle Mahlzeiten der Woche abdecken.
- Entwurf, Ergebnis und Häkchen nur im Arbeitsspeicher; bei Seitenneuladen verloren. UI macht dies verständlich. Ergebnis bleibt beim Öffnen/Schließen von Rezeptdetails erhalten.

## Auth und Verbindung

- Bestehenden Bearer-JWT nutzen. Für die erste Version Token tabbezogen in sessionStorage, nicht localStorage; dies erhält die Sitzung beim Neuladen, ist aber kein HttpOnly-Schutz. Token nicht loggen. Gemini-Schlüssel bleibt ausschließlich im Backend.
- Beim Start Session über `/api/auth/me` prüfen. Interceptor sendet Bearer nur an die eigene Backend-API und behandelt 401 bei geschützten Anfragen mit Session-Löschung und Rückkehr zum Login. Login-Fehler separat anzeigen. Guard dient Navigation, Backend bleibt die Autorität.
- Ohne Refresh-Token läuft die Sitzung nach einer Stunde ab. Logout löscht Token, Benutzer, Entwurf und Ergebnis. Kein „angemeldet bleiben“ in dieser Version. Bei Ablauf während einer Bearbeitung Entwurf höchstens vorübergehend im Speicher erhalten; nicht browserseitig speichern.
- Entwicklung: Angular-Port 4200, Proxy für `/api` zum Backend-Port 3000. Produktion: statisches Frontend und `/api` über denselben Ursprung per Reverse Proxy. Docker-Build mit getrennten Build-/Runtime-Stufen implementiert; bestehende MongoDB-Daten bleiben erhalten.
- Fehler nahe der betroffenen Aktion: Validierung, falsche Zugangsdaten, unerfüllbare Rezeptauswahl, Anfragelimit, KI-Ausfall und Zeitlimit. Eingaben bei Fehlern erhalten; erneuter Versuch nur auf ausdrücklichen Klick.

## Gestaltung und Qualität

Mobile zuerst; warmes Off-White, Grün als Hauptfarbe, gut lesbare Schrift, großzügige Abstände, klare primäre Aktion. Budget und Ergebnis im Mittelpunkt. Keine erfundenen Rezeptfotos.

Sichtbare Feldbeschriftungen, ausreichende Kontraste, Tastaturbedienung, sichtbarer Fokus, Fehlerzuordnung und angekündigte Lade-/Ergebniszustände. Mobile Darstellung mit vertikalen Rezeptkarten und Einkaufsliste statt breiter Tabellen.

Gezielte Tests für Euro/Cent-Konvertierung, Formularvalidierung, Auth-Handling und Fehlerzustände. Browserprüfungen für Registrierung → Login → Rezeptgenerierung → Einkaufsliste sowie mobilen Ablauf und Tastaturbedienung. Standardtests mit Mock-API; ein ausdrücklicher Live-Smoke-Test gegen das Backend, keine echten Gemini-Aufrufe im regulären Testlauf.

## Umsetzungsschritte

1. Angular-Grundgerüst, Ordnerstruktur, Routing, Designvariablen, App-Rahmen und Entwicklungsproxy.
2. Registrierung, Login, Session-Prüfung, Interceptor, Guard und Logout.
3. Geführtes Rezeptformular, Validierung und API-Anbindung mit Lade-/Fehlerzuständen.
4. Rezeptdetails, Budgetübersicht und Einkaufsliste mit temporären Häkchen.
5. Mobile und zugängliche Bedienung prüfen, gezielte Tests und Docker-Einbindung dokumentieren.

Jeder Schritt liefert einen lauffähigen Stand und aktualisiert die Projektplanung.

## Fortschritt

- Schritt 1 abgeschlossen: Angular 22.2.2 und Material/CDK 22.2.2, TypeScript 6, Strict-Modus, Standalone-Komponenten, deutsche Locale und Feature-Struktur unter Frontend/.
- Responsive Startseite, SCSS-Designvariablen, App-Rahmen, Navigation, lazy geladene Routen, Seitentitel und Ansicht für unbekannte URLs. Auth-/Rezeptrouten sind ausdrücklich als Vorschau gekennzeichnet; noch keine Formulare oder Guards.
- HttpClient und relative API-Basis vorbereitet; Entwicklungsproxy von /api/** auf 127.0.0.1:3000. Keine Schlüssel im Frontend.
- Produktionsbuild und TypeScript-Prüfung erfolgreich. npm meldet keine bekannten Schwachstellen. Browserprüfung bestätigt Navigation, direkte Route mit Neuladen, unbekannte URL, Sprunglink und Fokusführung. Breiten 320/390/768/1440 ohne horizontales Überlaufen; Desktop-/Mobilansicht visuell geprüft. Proxy liefert Datenbankbereitschaft mit HTTP 200. Keine Browser-Laufzeitfehler im erfolgreichen Abschlusslauf.
- Entwicklungsserver läuft lokal auf Port 4200. Nächster Schritt: echte Registrierung und Anmeldung mit Session-Prüfung, Guard, Interceptor und Logout.

## Verbindliche Komponentenstruktur

Jede Komponente erhält einen eigenen Ordner mit separater TypeScript-, HTML- und SCSS-Datei. Templates und Styles werden über templateUrl/styleUrl referenziert; keine Inline-Templates oder Inline-Styles, auch nicht bei kleinen Komponenten. Ordnernamen in kebab-case.

```text
src/app/
  app/                          # app.ts, app.html, app.scss
  layout/app-shell/             # app-shell.ts, app-shell.html, app-shell.scss
  features/home/home-page/      # home-page.ts, home-page.html, home-page.scss
  shared/ui/up-coming/          # upcoming-page.ts, upcoming-page.html, upcoming-page.scss
```

Bestehende Komponenten umgezogen und Imports angepasst. Angular-Generator ist auf eigene Ordner, externe Templates und externe SCSS-Dateien eingestellt. Services, Routing und Konfiguration benötigen keine HTML-/SCSS-Dateien.

## Schritt 2 – Authentifizierung implementiert

- Gemeinsame AuthPage mit eigenem Ordner und separaten TS/HTML/SCSS-Dateien für Login und Registrierung. Reactive Forms validieren Benutzernamen, Passwortlänge und echtes, nicht zukünftiges Kalenderdatum anhand Europe/Berlin. Passwort sichtbar schaltbar; native Autocomplete-Angaben; keine Zeitzonenumrechnung des Geburtstags.
- AuthApi kapselt Login/Register/Me, AuthService koordiniert die Sitzung, SessionStore enthält Signals und nur den tabbezogen gespeicherten Token. Startprüfung über /auth/me; JWT exp bestimmt lokalen Ablauf, nicht die expiresIn-Angabe der Antwort. Kein Refresh-Token und keine Passwortspeicherung.
- Funktionaler Interceptor hängt Bearer nur an eigene API-Pfade und nicht an Login/Register. Aktuelle geschützte 401-Antwort löscht Sitzung; verspätete Antworten alter Sitzungen überschreiben keine neue Sitzung. Guard schützt /rezepte; eingeloggte Nutzer werden von Auth-Seiten dorthin geleitet. Nur bekannte interne Rückkehrroute erlaubt.
- Logout, personalisierte Navigation und Ablaufhinweis. Netzwerkfehler erhalten den Token, eine manuelle Sitzungsprüfung ist möglich. Zehn Sekunden HTTP-Zeitlimit; keine automatischen Auth-Wiederholungen. Initialer Ladehinweis statt leerer Seite.
- TypeScript im Strict-Modus einschließlich Templates, Build und 16 Vitest-Tests bestanden. Realer Browserablauf: Registrierung, Login, falsches Passwort, doppelter Benutzername, Sitzung nach Reload und Logout erfolgreich. 401/429/503 und manueller Wiederholungsversuch zusätzlich mit Browser-Mocks geprüft; keine Browser-Laufzeitfehler. Formulare bei 320/390/768/1440 ohne horizontales Überlaufen; mehrzeilige Meldungen mit dynamischer Höhe und Fokus auf erstes ungültiges Feld. Temporäres Nutzerkonto wieder entfernt; keine echten Gemini-Aufrufe.
- Nächster Schritt: geführtes Rezeptformular mit Lade-/Fehlerzuständen und Anbindung an POST /api/recipes/generate.

## Schritt 3 – Geführte Rezeptanfrage implementiert

- RecipePage im eigenen Ordner mit separaten TS/HTML/SCSS-Dateien ersetzt die geschützte Rezept-Vorschau. Drei Schritte mit kontrollierter Navigation: Supermarkt/Budget/Personen/Lebenssituation, Ernährung/Allergien/Ausschlüsse/Kochzeit, Rezeptanzahl und Zusammenfassung.
- Supermärkte über GET /api/products/supermarkets mit Ladezustand und manuellem Retry. Deutsche Labels für Backend-Kennungen. Reactive Forms prüfen gleiche Grenzen wie das Backend; Dezimalstrings werden ohne Float-Rundung in ganze Cent umgerechnet, Tausendertrennzeichen/mehr als zwei Nachkommastellen werden abgewiesen.
- RecipeApi kapselt POST /api/recipes/generate. RecipeWorkspace hält Entwurf, Schritt, Ladezustand und Ergebnis ausschließlich im Arbeitsspeicher. Doppelklickschutz, 70 Sekunden HTTP-Zeitlimit und keine automatischen erneuten KI-Anfragen. Form während Generierung gesperrt; Fehler erhalten Eingaben. Navigation weg von der Rezeptseite bricht einen laufenden clientseitigen Aufruf ab.
- Entwurf bleibt beim Zurückgehen und interner Navigation erhalten. Neue Anfrage und Logout setzen ihn zurück. Nach Sitzungsablauf nur für denselben Nutzer temporär erhalten; anderer Nutzer bekommt einen neuen Entwurf. Ergebnisse werden bei Sitzungsablauf gelöscht und alte Anfragen bei Tokenwechsel abgebrochen.
- Erste RecipeResults-Komponente mit Budgetübersicht, Rezeptkarten und aufklappbaren Zutaten/Kochschritten. Testpreise und fehlende vollständige Wochenabdeckung klar gekennzeichnet. Detaillierte Einkaufsliste und temporäre Artikel-Häkchen bleiben Schritt 4.
- Build und Strict-TypeScript erfolgreich; 32 Tests bestanden. Browser: Eingabevalidierung, Rücknavigation, deutscher exakter Payload, gesperrte Ladeansicht, 422/429/503/504-Meldungen, Neu-Anfrage, Reload und fehlende Präferenzspeicherung geprüft. Alle Formularschritte bei 320/390/768/1440 ohne horizontales Überlaufen; Ergebnis auf Mobil und Desktop visuell geprüft; keine Browser-Laufzeitfehler.
- Echte Gemini-Anfrage über die Oberfläche: HTTP 200, REWE, 4029 Cent, eine Person, Student, vegan, Gluten und Milch ausgeschlossen, bis 30 Minuten, drei Rezepte. Ergebnis Linsen-Karotten-Eintopf, Tomaten-Reis-Pfanne, Kartoffel-Karotten-Pfanne; Gesamtkosten 1303 Cent, Restbudget 2726 Cent, priceType=test. Rezeptzahl, Portionen, Kochzeit und gefilterte Produkt-Metadaten zusätzlich geprüft. Testnutzer wieder gelöscht.
- Nächster Schritt: Einkaufsliste mit Packungsmengen, Einzelkosten, Restmengen und temporären Artikel-Häkchen.

## Schritt 4 – Einkaufsliste implementiert

- ShoppingList im eigenen Ordner mit separaten TS-, HTML- und SCSS-Dateien ergänzt. Zeigt benötigte Menge über alle Rezepte, ganze Packungen, Kaufmenge, Restmenge, Preis pro Packung, Artikelkosten und Gesamtkosten. Backend-Mengen und Centbeträge werden unverändert dargestellt; g/ml/Stück mit deutscher Zahlenformatierung.
- Zugängliche native Checkboxen und angekündigter Artikelzähler. Abhaken beeinflusst weder Kosten noch Restbudget. Häkchen ausschließlich im RecipeWorkspace-Arbeitsspeicher, bei interner Navigation erhalten; Angaben ändern/neue Auswahl/neue Anfrage/Ablauf/Logout/Reload löschen sie. Unbekannte Produkt-IDs werden ignoriert.
- Geprüft: Strict-TypeScript, Produktionsbuild und 35 automatisierte Tests bestanden. Browser mit Mock-API bestätigt Tastaturbedienung, Packungsmengen/Restmengen, unveränderte Kosten, Navigationserhalt und Reset bei neuer Auswahl/Reload. Breiten 320/390/768/1440 ohne horizontales Überlaufen; Desktop und Mobil visuell geprüft, keine Laufzeitfehler. Keine echten KI-Aufrufe oder neuen Nutzerkonten für diese Prüfung.
- Nächster Schritt: Docker-Einbindung des Frontends mit Reverse Proxy und gemeinsame Startanleitung; abschließende Prüfung des Gesamtflusses.

## Schritt 5 – Docker und Gesamtprüfung abgeschlossen

- Frontend/Dockerfile mit getrennten Node-24-Build-/Nginx-1.28-Laufzeitstufen sowie .dockerignore und nginx.conf ergänzt. Backend/compose.yaml um Frontend auf 127.0.0.1:8080 erweitert; FRONTEND_PORT in vorhandener .env und .env.example ergänzt. Bestehender Compose-Projektname und MongoDB-Volume erhalten.
- Nginx liefert statisches Angular und SPA-Fallback; /api wird unter Erhalt von Pfad, Bearer-Header und Fehlerstatus an backend:3000 weitergeleitet. Docker-DNS-Auflösung für neu erstellte Backend-Container, 75 Sekunden Proxy-Lesezeitlimit und keine automatischen Wiederholungen. API no-store, index no-cache, Fingerprint-Assets immutable; fehlende Assets liefern 404.
- Compose wartet auf Backend-Bereitschaft vor Frontend-Start. Frontend /healthz prüft Nginx; /api/health/ready Backend und MongoDB. Gemeinsame Startanleitungen und optionaler Port dokumentiert. Für lokale Angular-Entwicklung weiterhin Port 4200 und gezielter Start von backend/mongodb möglich.
- Geprüft: Compose-Konfiguration, mehrstufige Docker-Builds und Nginx-Syntax erfolgreich; alle drei Container healthy. Vier neue HTTP-Integrationstests (npm run test:docker) prüfen echte SPA-Routen, Assets/Cache, API-Fehler/Auth/Readiness und Swagger; auch nach erneutem Erstellen des Backend-Containers erfolgreich.
- Browser gegen Docker-Oberfläche bestätigt Registrierung, Formularvalidierung, Rücknavigation, Lade-/Fehlerzustände, mobile Breiten 320–1440 und Neuladen mit Session-Wiederherstellung. Echter Frontend→Nginx→NestJS→Gemini-Aufruf liefert 200: drei vegane Rezepte (Linsen-Karotten-Topf, Kartoffel-Karotten-Pfanne, Tomaten-Reis-Pfanne), REWE/Budget 4029 Cent, Gesamtkosten 1303 Cent, Restbudget 2726 Cent. Einkaufsliste abgehakt und visuell geprüft; keine Browser-Laufzeitfehler. Testnutzer anschließend gelöscht.
- Erste vereinbarte Frontend-Version vollständig implementiert. Reale Supermarktpreise und vollständige Wochenplanung bleiben eigene nächste fachliche Schritte; keine zusätzlichen Funktionen vorweggenommen.

## Frontend-Refactoring – Tailwind statt Angular Material

- Auf Nutzerwunsch bestehendes Design erhalten und Angular Material/CDK vollständig aus Dependencies, Imports, Templates und globalem Theme entfernt. Tailwind CSS und @tailwindcss/postcss 4.3.3 mit PostCSS integriert, Docker-Build angepasst. Keine Änderungen am Backend-Vertrag oder an Profil-/Rezeptpersistenz.
- src/tailwind.css enthält gemeinsame Farben, Buttons und Outline-Formularfelder über Tailwind; vorhandene Seitenlayouts und besondere Gestaltung bleiben in SCSS. Kein Preflight-Reset, bestehende globale Regeln in base-Layer. Separate TS/HTML/SCSS-Dateien pro Komponente bleiben verbindlich.
- Native Inputs/Selects mit expliziten Labels, ARIA-Fehler-/Hinweiszuordnungen und Validierung erst nach Berührung. Neue shared/ui/multi-select-Komponente mit ControlValueAccessor, Checkboxen, sichtbarer Auswahl, Escape/Fokus-Rückgabe, Außenklick/Fokuswechsel und disabled-Unterstützung ersetzt Material-Mehrfachauswahl. Rezeptanzahl via ngValue weiterhin numerisch.
- Bereits verschobene Auth-Modelle/Guards/Interceptor berücksichtigt: veraltete Imports in Services und Tests an vorhandene shared-Struktur angepasst. Keine Rückverschiebung der Nutzerstruktur.
- Geprüft: Strict-TypeScript, Produktionsbuild und 38 Tests erfolgreich, darunter drei neue Mehrfachauswahl-Tests. Browser-Mock-API bestätigt Auswahl von Allergien/Zutaten, Rezeptablauf/Einkaufsliste, Checkbox-Tastaturbedienung, Navigation/Reset, Login-/Registrierungsvalidierung, Passwortanzeige und Fehlererhalt. Start/Auth/Ergebnis bei 320/390/768/1440 ohne Überlaufen; Desktopansichten visuell geprüft, keine Laufzeitfehler. Keine echten Gemini-Aufrufe für diese Umstellung.
- Docker-Image mit PostCSS-Konfiguration erfolgreich gebaut, alle Dienste healthy.
- Abschlussprüfung: vier Docker-HTTP-Integrationstests und Browserablauf gegen den Tailwind-Produktionsbuild erfolgreich. Mehrfachauswahl auch vollständig per Tastatur geprüft; Essenswünsche-Ansicht ebenfalls bei 320–1440 Pixeln ohne Überlaufen und mobil visuell geprüft.

## Nächste Erweiterung: gespeicherte Auswahlen

Backend-Speicher-API ist implementiert; Details in Backend/README.md. Frontend-Anbindung folgt: vollständige Generierungsantwort inklusive saveProof behalten, explizit speichern und gespeicherte Auswahlen auflisten/öffnen/löschen. Anfrageparameter bleiben außerhalb des Profils. Bis zur Frontend-Anbindung bleiben Entwurf, Ergebnis und Häkchen der Oberfläche wie bisher im Arbeitsspeicher.

## Gespeicherte Rezeptauswahlen – Frontend implementiert

- SaveSelection im eigenen TS/HTML/SCSS-Ordner ergänzt: Name, explizites Speichern kompletter Antwort einschließlich saveProof und aktuellem Häkchenstand, Lade-/Erfolgs-/Fehlerzustände und Link zur gespeicherten Auswahl. Keine Rekonstruktion signierter Daten, keine automatische Speicherung oder erneute KI-Anfrage. Fehlender Nachweis bei alten Ergebnissen erklärt.
- Neues lazy geladenes saved-recipes-Feature unter /gespeichert und /gespeichert/:id, AuthGuard und Navigationslink. Übersicht mit Datum, Titeln, Kosten, leerem Zustand und Seiteneinteilung; vollständige Detailansicht wiederverwendet RecipeResults/ShoppingList und lädt gespeicherte Häkchen. Neue Häkchenänderungen ausdrücklich nur lokal.
- Native Löschbestätigung mit Fokusführung, Abbrechen/Escape, gesperrtem laufendem Löschen und Fehler-/Retry-Zustand. Erfolgreiches Löschen aktualisiert Übersicht und lokalen Speicherstatus; Löschen letzter Einträge berücksichtigt vorherige Seite. Fehlende Auswahl und Verbindungsfehler mit manueller Wiederholung.
- SavedRecipesApi mit zehn Sekunden Zeitlimit, Root-Speicherstatus nur für aktuelle Generierung, seitenbezogener SavedRecipesStore. Token-/Resultwechsel und zerstörte Ansichten brechen alte Requests ab; keine alten Daten in neuen Konten. Sichere Login-Rückkehr um gespeicherte Routen erweitert. Neue Anfrage aus gespeicherter Ansicht setzt den temporären Entwurf zurück.
- Geprüft: TypeScript und Produktionsbuild; 49 Frontend-Tests einschließlich unveränderter/erweiterter Snapshot-Payloads, Doppelklickschutz, echtem Formular-Submit ohne Reload, Fehler-/Timeout-Retry, Sitzungswechsel, Häkchen-Wiederherstellung, Pagination/Löschung und sicheren Rückkehrpfaden.
- Browser mit realem Backend/Gemini bestätigt Generierung 200, explizites Speichern, vollständiges Öffnen/Neuladen und persistierten Häkchenstand, Übersicht/Leerzustand, Löschbestätigung, Löschen und Guard. Mock-503 bei Speichern/Löschen erhält Daten und erlaubt manuelle Wiederholung. Ansichten bei 320/390/768/1440 ohne Überlaufen, Desktop/Mobil visuell geprüft, keine Laufzeitfehler. Temporären Nutzer und seine gespeicherten Auswahlen gelöscht.
- Abschlussprüfung: aktualisiertes Frontend-Docker-Image gebaut, alle Dienste healthy. Vier Docker-HTTP-Integrationstests einschließlich gespeicherter SPA-Routen erfolgreich; Browserablauf mit Mock-API gegen den Produktionsbuild bestätigt Speichern, Öffnen, Neuladen und Löschen ohne Laufzeitfehler.

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
