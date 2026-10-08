# Projektkontext

Vor Änderungen `docs/PLAN.md` lesen. Dort stehen die vereinbarten Entscheidungen und der aktuelle Fortschritt.

- Kommunikation mit dem Nutzer auf Deutsch.
- Schrittweise implementieren; keine unangeforderten zusätzlichen Features.
- Backend-Code und zugehörige Konfiguration liegen in `Backend/`; npm-Befehle dort ausführen. Das spätere Angular-Frontend liegt in `Frontend/`.
- Backend: TypeScript, NestJS, MongoDB/Mongoose, Docker Compose, Gemini.
- Modularer Monolith; Geschäftslogik von HTTP und externen Anbietern trennen.
- Budget, Supermarkt, Personenanzahl, Lebenssituation, Ernährung, Allergien und Kochzeit pro Rezeptanfrage entgegennehmen; nicht im Benutzerprofil speichern.
- Preise niemals von KI erfinden lassen; Geld in ganzen Centbeträgen berechnen.
- Geheimnisse nicht ins Repository schreiben.
- Abgeschlossene Schritte und tatsächliche Prüfungen in `docs/PLAN.md` aktualisieren.

- Frontend: Tailwind CSS mit PostCSS statt Angular Material/CDK. Bestehende Gestaltung beibehalten; spezifische Seitenlayouts dürfen weiter in SCSS liegen.

- Angular-Komponenten liegen jeweils in einem eigenen Ordner und enthalten separate `.ts`-, `.html`- und `.scss`-Dateien (auch die Root-Komponente). Keine Inline-Templates oder Inline-Styles. Ordnernamen in kebab-case; `UpcomingPage` liegt nach Nutzerwunsch unter `shared/ui/up-coming/`.
