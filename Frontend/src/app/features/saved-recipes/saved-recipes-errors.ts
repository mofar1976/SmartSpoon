import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';
export function savedRecipesError(error: unknown, action: 'save' | 'load' | 'delete'): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 401) return 'Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.';
    if (error.status === 404) return 'Diese gespeicherte Auswahl ist nicht mehr verfügbar.';
    if (error.status === 400 && action === 'save')
      return 'Diese Auswahl kann nicht gespeichert werden. Der Speichernachweis kann nach 24 Stunden ablaufen. Bitte erstelle bei Bedarf neue Rezepte.';
    if (error.status === 429) return 'Zu viele Anfragen. Bitte versuche es in einer Minute erneut.';
  }
  if (action === 'save')
    return 'Das Speichern konnte nicht bestätigt werden. Deine Auswahl bleibt erhalten. Du kannst erneut speichern; dieselbe Auswahl wird nicht doppelt angelegt.';
  if (error instanceof TimeoutError)
    return 'Die Anfrage dauert zu lange. Bitte versuche es erneut.';
  return action === 'delete'
    ? 'Das Löschen konnte nicht bestätigt werden. Bitte versuche es erneut.'
    : 'Deine gespeicherten Auswahlen konnten nicht geladen werden. Bitte versuche es erneut.';
}
