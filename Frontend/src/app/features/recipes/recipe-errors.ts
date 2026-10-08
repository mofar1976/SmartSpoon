import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';
export function recipeErrorMessage(error: unknown): string {
  if (error instanceof TimeoutError)
    return 'Die Antwort dauert zu lange. Deine Angaben bleiben erhalten. Du kannst es erneut versuchen.';
  if (error instanceof HttpErrorResponse) {
    switch (error.status) {
      case 400:
        return 'Bitte prüfe deine Angaben. Die Anfrage konnte nicht übernommen werden.';
      case 401:
        return 'Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.';
      case 422:
        return 'Für diese Angaben konnte keine passende Rezeptauswahl erstellt werden. Erhöhe das Budget oder passe die Essenswünsche an.';
      case 429:
        return 'Du hast gerade mehrere Anfragen gestellt. Bitte warte eine Minute, bevor du es erneut versuchst.';
      case 502:
        return 'Die Rezeptantwort konnte nicht verarbeitet werden. Bitte versuche es noch einmal.';
      case 503:
        return 'Die Rezeptgenerierung ist gerade nicht verfügbar. Bitte versuche es später erneut.';
      case 504:
        return 'Die Rezeptgenerierung hat zu lange gedauert. Du kannst es erneut versuchen.';
      case 0:
        return 'Die Verbindung wurde unterbrochen. Prüfe deine Internetverbindung und versuche es erneut.';
    }
  }
  return 'Das hat gerade nicht geklappt. Deine Angaben bleiben erhalten. Bitte versuche es erneut.';
}
