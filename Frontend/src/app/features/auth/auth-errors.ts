import { HttpErrorResponse } from '@angular/common/http';
export function authErrorMessage(error: unknown, register: boolean): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 401)
      return 'Benutzername oder Passwort ist falsch. Bitte prüfe deine Eingaben.';
    if (error.status === 409 && register)
      return 'Dieser Benutzername ist schon vergeben. Wähle bitte einen anderen.';
    if (error.status === 400)
      return 'Bitte prüfe deine Eingaben. Sie konnten nicht übernommen werden.';
    if (error.status === 429)
      return 'Zu viele Versuche. Bitte warte eine Minute und versuche es erneut.';
    if (error.status === 0 || error.status >= 500)
      return 'Die Verbindung klappt gerade nicht. Deine Eingaben bleiben erhalten. Versuche es gleich noch einmal.';
  }
  return 'Das hat gerade nicht geklappt. Deine Eingaben bleiben erhalten. Bitte versuche es erneut.';
}
