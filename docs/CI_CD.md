# GitHub und CI/CD

Ab jetzt werden Frontend und Backend schrittweise refaktoriert. Neue Produktfunktionen sind vorerst pausiert. Jede Änderung soll das bestehende Verhalten erhalten und durch die vorhandenen Prüfungen abgesichert werden.

## Repository

Ein gemeinsames Repository mit Backend/, Frontend/ und docs/. Hauptbranch: main. Refactorings in kurzen Branches (z. B. refactor/backend-auth), danach Pull Request nach main. In GitHub eine Branch-Regel für main einrichten: Pull Requests und erfolgreiche Prüfungen Backend, Frontend und Docker integration verlangen. Die Regel wird erst nach dem ersten CI-Lauf eingerichtet, damit GitHub die Prüfungen kennt.

Die lokale Backend/.env wird nicht eingecheckt. Ebenso ausgeschlossen: node_modules, Build-Ausgaben, Logs und Coverage. Backend/.env.example dokumentiert Konfiguration ohne echte Schlüssel. CI braucht keinen Gemini-Schlüssel und keine Repository-Secrets.

## Implementierte CI

.github/workflows/ci.yml läuft bei Push, Pull Request und manuell. Node 24, reproduzierbare Installation mit npm ci und beiden Lockfiles.

- Backend: TypeScript, Build/Unit-Tests, HTTP-Integration mit isolierter MongoDB 8 und Mock-KI.
- Frontend: TypeScript, Unit-Tests und Angular-Produktionsbuild.
- Docker integration: erst nach beiden erfolgreichen Jobs; baut beide Images, startet den Stack bis zur Bereitschaft und prüft SPA-Routen, Assets, Reverse Proxy, Auth-Fehler und Swagger. Eigener Compose-Projektname; Testcontainer und Testvolume werden immer entfernt.

Berechtigungen auf lesenden Repository-Zugriff beschränkt. Keine Deployment- oder Registry-Zugangsdaten, keine echten KI-Aufrufe. Abgelöste Läufe desselben Branches werden abgebrochen.

Prettier ist noch keine Pflichtprüfung: Bestandsdateien sind teilweise unformatiert. Die Formatierungsbasis wird in einem eigenen Refactoring-Schritt vereinheitlicht und danach als CI-Prüfung ergänzt. Ein Linter ist bisher nicht eingerichtet.

## CD – vereinbarter Entwurf, noch nicht aktiviert

1. Versionierte Releases über Tags vX.Y.Z von einem erfolgreich geprüften main-Commit.
2. Backend- und Frontend-Images einmal bauen und in GitHub Container Registry veröffentlichen. Beide mit gleicher Release-Version und Commit-SHA; Deployment verwendet die unveränderlichen Image-Digests.
3. Zunächst nur Bereitstellung der Release-Images. Kein automatisches Deployment.
4. Sobald ein Zielsystem feststeht: eigenes GitHub-Environment mit Freigabe, dort hinterlegte Laufzeit-Secrets und explizites manuelles Deployment eines ausgewählten Releases.
5. Bereitschaft nach Deployment prüfen. Rollback auf die vorherigen Image-Digests; MongoDB-Daten erhalten. Datenbank-Backups und spätere Schemaänderungen benötigen einen gesonderten Plan.

Hosting, Registry-Sichtbarkeit, Domain/TLS und Deployment-Zugriff sind noch offen. Ein CD-Workflow wird erst ergänzt, wenn diese Entscheidungen konkret sind. Aktuell veröffentlicht kein Workflow Images oder startet ein Deployment.

## Erster Push

Nach Festlegen der GitHub-URL: lokales Repository mit main initialisieren, ausgeschlossene Dateien prüfen, initialen Commit erstellen, origin setzen und main pushen. Danach den tatsächlichen GitHub-Actions-Lauf prüfen. Lokale erfolgreiche Tests ersetzen keine Bestätigung des ersten GitHub-Laufs.
