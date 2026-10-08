import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

type PageKind = 'recipes' | 'not-found';
const pages = {
  recipes: {
    eyebrow: 'DEINE REZEPTAUSWAHL',
    title: 'Ein guter Plan beginnt bei dir.',
    text: 'Hier entsteht dein geführtes Formular für Budget, Supermarkt und Essenswünsche. Die Rezeptanfrage ergänzen wir im nächsten Schritt.',
  },
  'not-found': {
    eyebrow: 'SEITE NICHT GEFUNDEN',
    title: 'Hier ist gerade nichts auf dem Teller.',
    text: 'Diese Seite gibt es nicht. Auf der Startseite findest du wieder den richtigen Weg.',
  },
};

@Component({
  imports: [RouterLink],
  templateUrl: './upcoming-page.html',
  styleUrl: './upcoming-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpcomingPage {
  protected readonly kind = inject(ActivatedRoute).snapshot.data['kind'] as PageKind;
  protected readonly page = pages[this.kind];
}
