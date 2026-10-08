import { SaveSelection } from '../recipes/save-selection/save-selection';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { SessionStore } from '../../core/auth/session-store';
import { authInterceptor } from '../../shared/interceptors/auth.interceptor';
import { safeReturnUrl } from '../../shared/guards/auth.guard';
import { RecipeWorkspace } from '../recipes/recipe-workspace';
import { RecipeSaveState } from '../recipes/recipe-save-state';
import { RecipeResult } from '../recipes/recipe.models';
import { SavedRecipesStore } from './saved-recipes-store';
const id = '1'.repeat(24),
  productId = '2'.repeat(24);
const result: RecipeResult = {
  saveProof: 'signed-proof',
  recipes: [
    {
      title: 'Reisgericht',
      servings: 1,
      cookingTimeMinutes: 20,
      ingredients: [{ productId, productName: 'Reis', quantity: 600, unit: 'g' }],
      steps: ['Reis garen.'],
    },
  ],
  shoppingList: [
    {
      product: {
        id: productId,
        name: 'Reis',
        supermarket: 'rewe',
        packageQuantity: 500,
        packageUnit: 'g',
        priceCents: 199,
        currency: 'EUR',
        priceType: 'test',
      },
      neededQuantity: 600,
      packs: 2,
      purchasedQuantity: 1000,
      leftoverQuantity: 400,
      costCents: 398,
    },
  ],
  totalCostCents: 398,
  remainingBudgetCents: 3602,
  currency: 'EUR',
  priceType: 'test',
  priceNotice: 'Testpreise.',
};
Object.assign(result.shoppingList[0].product, {
  sku: 'original-sku',
  sourceLabel: 'Testkatalog',
  allergens: [],
  observedAt: null,
});
const saved = {
  id,
  title: 'Mein Einkauf',
  result,
  checkedProductIds: [productId],
  createdAt: '2026-10-08T10:00:00Z',
  generatedAt: '2026-10-08T09:59:00Z',
};
let http: HttpTestingController,
  session: SessionStore,
  workspace: RecipeWorkspace,
  state: RecipeSaveState,
  store: SavedRecipesStore;
beforeEach(() => {
  sessionStorage.clear();
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withInterceptors([authInterceptor])),
      provideHttpClientTesting(),
      provideRouter([]),
      SavedRecipesStore,
    ],
  });
  http = TestBed.inject(HttpTestingController);
  session = TestBed.inject(SessionStore);
  session.setToken(
    'header.' + btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })) + '.signed',
  );
  session.confirm({ id: 'owner', username: 'student', birthDate: null });
  workspace = TestBed.inject(RecipeWorkspace);
  state = TestBed.inject(RecipeSaveState);
  store = TestBed.inject(SavedRecipesStore);
  TestBed.tick();
  workspace.result.set(structuredClone(result));
  TestBed.tick();
});
afterEach(() => {
  http.verify();
  TestBed.resetTestingModule();
  sessionStorage.clear();
  vi.useRealTimers();
});
describe('saving selections', () => {
  it('sends the unchanged response including metadata and checks with no duplicate or AI request', () => {
    state.title.setValue(' Mein Einkauf ');
    workspace.setPurchased(productId, true);
    state.save();
    state.save();
    const r = http.expectOne('/api/saved-recipes');
    expect(r.request.body).toEqual({
      result,
      title: 'Mein Einkauf',
      checkedProductIds: [productId],
    });
    expect(r.request.headers.get('Authorization')).toBe('Bearer ' + session.token());
    http.expectNone('/api/recipes/generate');
    r.flush(saved);
    state.save();
    http.expectNone('/api/saved-recipes');
    expect(state.savedId()).toBe(id);
    expect(sessionStorage.length).toBe(1);
  });
  it('rejects blank names and missing proof', () => {
    state.title.setValue(' ');
    state.save();
    http.expectNone('/api/saved-recipes');
    workspace.result.set({ ...result, saveProof: undefined });
    TestBed.tick();
    state.save();
    http.expectNone('/api/saved-recipes');
    expect(state.error()).toContain('neue Auswahl');
  });
  it('keeps the result after failed saving and retries only manually', () => {
    state.save();
    http.expectOne('/api/saved-recipes').flush({}, { status: 503, statusText: 'Unavailable' });
    expect(workspace.result()).toEqual(result);
    expect(state.busy()).toBe(false);
    http.expectNone('/api/saved-recipes');
    state.save();
    http.expectOne('/api/saved-recipes').flush(saved);
    expect(state.savedId()).toBe(id);
  });
  it('cancels and clears save state on result change and logout', () => {
    state.save();
    const r = http.expectOne('/api/saved-recipes');
    workspace.edit();
    TestBed.tick();
    expect(r.cancelled).toBe(true);
    workspace.result.set(result);
    TestBed.tick();
    state.save();
    const next = http.expectOne('/api/saved-recipes');
    session.clear();
    TestBed.tick();
    expect(next.cancelled).toBe(true);
    expect(state.savedId()).toBeNull();
  });
  it('bounds waiting and permits saving again after deletion', () => {
    vi.useFakeTimers();
    state.save();
    const r = http.expectOne('/api/saved-recipes');
    vi.advanceTimersByTime(10001);
    expect(r.cancelled).toBe(true);
    expect(state.busy()).toBe(false);
    vi.useRealTimers();
    state.save();
    http.expectOne('/api/saved-recipes').flush(saved);
    state.forget(id);
    state.save();
    http.expectOne('/api/saved-recipes').flush(saved);
  });
  it('loads complete detail and restores stored checks without changing the snapshot', () => {
    store.load(id);
    http.expectOne('/api/saved-recipes/' + id).flush(saved);
    expect([...store.checked()]).toEqual([productId]);
    store.setPurchased(productId, false);
    expect(store.detail()?.checkedProductIds).toEqual([productId]);
    expect(store.detail()?.result).toEqual(result);
    store.load(id);
    http.expectOne('/api/saved-recipes/' + id).flush(saved);
    expect([...store.checked()]).toEqual([productId]);
  });
  it('moves to the previous page when deleting its last entry', () => {
    store.load(null, 20);
    http
      .expectOne('/api/saved-recipes?limit=20&offset=20')
      .flush({
        items: [{ ...saved, recipeTitles: ['Reisgericht'] }],
        total: 21,
        limit: 20,
        offset: 20,
      });
    store.remove(id);
    store.remove(id);
    http.expectOne('/api/saved-recipes/' + id).flush(null);
    http
      .expectOne('/api/saved-recipes?limit=20&offset=0')
      .flush({ items: [], total: 0, limit: 20, offset: 0 });
    expect(store.deletedId()).toBe(id);
  });
  it('cancels stale loads and clears data on logout', () => {
    store.load(id);
    const r = http.expectOne('/api/saved-recipes/' + id);
    store.load('3'.repeat(24));
    expect(r.cancelled).toBe(true);
    http
      .expectOne('/api/saved-recipes/' + '3'.repeat(24))
      .flush({}, { status: 404, statusText: 'Not found' });
    expect(store.error()).toContain('nicht mehr verfügbar');
    store.load(id);
    http.expectOne('/api/saved-recipes/' + id).flush(saved);
    session.clear();
    TestBed.tick();
    expect(store.detail()).toBeNull();
    expect(store.checked().size).toBe(0);
  });
  it('preserves detail after failed deletion and permits retry', () => {
    store.load(id);
    http.expectOne('/api/saved-recipes/' + id).flush(saved);
    store.remove(id);
    http
      .expectOne('/api/saved-recipes/' + id)
      .flush({}, { status: 503, statusText: 'Unavailable' });
    expect(store.detail()?.id).toBe(id);
    expect(store.deleteError()).toContain('nicht bestätigt');
    store.remove(id);
    http.expectOne('/api/saved-recipes/' + id).flush(null);
    expect(store.detail()).toBeNull();
  });
  it('allows return only to known internal saved-selection routes', () => {
    expect(safeReturnUrl('/gespeichert')).toBe('/gespeichert');
    expect(safeReturnUrl('/gespeichert/' + id)).toBe('/gespeichert/' + id);
    for (const url of [
      '//external.test',
      'https://external.test',
      '/gespeichert/invalid',
      '/gespeichert/' + id + '?next=external',
    ])
      expect(safeReturnUrl(url)).toBe('/rezepte');
  });
});

it('the save form submits without reloading the page', () => {
 const fixture = TestBed.createComponent(SaveSelection); fixture.detectChanges();
 const event = new Event('submit', { bubbles: true, cancelable: true });
 fixture.nativeElement.querySelector('form').dispatchEvent(event);
 expect(event.defaultPrevented).toBe(true);
 http.expectOne('/api/saved-recipes').flush(saved);
 fixture.detectChanges(); expect(fixture.nativeElement.textContent).toContain('Rezepte und Einkaufsliste gespeichert.');
});
