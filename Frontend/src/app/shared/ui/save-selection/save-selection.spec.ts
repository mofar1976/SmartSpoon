import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { provideTranslations } from '../../../core/i18n/i18n-service';
import { PantryResult } from '../../../features/pantry-recipes/pantry-recipes.models';
import { SaveSelectionForm } from './save-selection';
const result: PantryResult = {
  mode: 'pantry',
  saveProof: 'test-proof',
  requiresIngredientReview: true,
  notice: 'Review',
  recipes: [
    {
      title: 'Bananenreis',
      servings: 1,
      cookingTimeMinutes: 20,
      ingredients: [],
      steps: ['Kochen.'],
      shoppingList: [],
    },
  ],
};
function setup() {
  TestBed.configureTestingModule({ providers: [provideTranslations('de'), provideRouter([])] });
  const fixture = TestBed.createComponent(SaveSelectionForm);
  fixture.componentRef.setInput('result', result);
  fixture.componentRef.setInput('state', {
    busy: false,
    savedId: null,
    savedTitle: null,
    errorKey: null,
  });
  fixture.detectChanges();
  return fixture;
}
afterEach(() => TestBed.resetTestingModule());
describe('shared recipe save form', () => {
  it('handles a real form submit, prevents reload and emits only a validated trimmed title', () => {
    const fixture = setup(),
      save = vi.fn();
    fixture.componentInstance.saveRequested.subscribe(save);
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    fixture.componentInstance.title.setValue('  ');
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(save).not.toHaveBeenCalled();
    fixture.componentInstance.title.setValue('  Mein Vorrat  ');
    const event = new Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(save).toHaveBeenCalledExactlyOnceWith('Mein Vorrat');
  });
  it('preserves the edited name through busy and retry states and prevents duplicate submits', () => {
    const fixture = setup(),
      save = vi.fn();
    fixture.componentInstance.saveRequested.subscribe(save);
    fixture.componentInstance.title.setValue('Mein Vorrat');
    fixture.componentRef.setInput('state', {
      busy: true,
      savedId: null,
      savedTitle: null,
      errorKey: null,
    });
    fixture.detectChanges();
    fixture.componentInstance.save();
    expect(save).not.toHaveBeenCalled();
    fixture.componentRef.setInput('state', {
      busy: false,
      savedId: null,
      savedTitle: null,
      errorKey: 'errors.savedUnconfirmed',
    });
    fixture.detectChanges();
    expect(fixture.componentInstance.title.value).toBe('Mein Vorrat');
    fixture.componentInstance.save();
    expect(save).toHaveBeenCalledExactlyOnceWith('Mein Vorrat');
  });
});
