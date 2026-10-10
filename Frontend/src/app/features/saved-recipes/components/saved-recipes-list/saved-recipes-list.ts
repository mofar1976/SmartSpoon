import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { SavedRecipeList } from '../../saved-recipes.models';
import { SavedRecipeCard } from '../saved-recipe-card/saved-recipe-card';

@Component({
  selector: 'app-saved-recipes-list',
  host: { class: 'block' },
  imports: [TranslatePipe, RouterLink, SavedRecipeCard],
  templateUrl: './saved-recipes-list.html',
  styleUrl: './saved-recipes-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SavedRecipesList {
  readonly selectionList = input.required<SavedRecipeList>();
  readonly deleting = input(false);
  readonly deleteRequested = output<{ id: string; title: string }>();
  readonly pageRequested = output<number>();
}
