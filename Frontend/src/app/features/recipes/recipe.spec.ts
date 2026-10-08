import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionStore } from '../../core/auth/session-store';
import { authInterceptor } from '../../shared/interceptors/auth.interceptor';
import { RecipeWorkspace } from './recipe-workspace';
import { createRecipeForm, euroToCents } from './recipe-validation';
import { RecipeResult } from './recipe.models';
import { recipeErrorMessage } from './recipe-errors';

const token = (suffix = 'signature') =>
  'header.' + btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })) + '.' + suffix;
const user = { id: 'owner', username: 'student', birthDate: '2000-05-15' };
const result: RecipeResult = {
  recipes: [
    {
      title: 'Reis mit Tomaten',
      servings: 1,
      cookingTimeMinutes: 20,
      ingredients: [{ productId: 'rice', productName: 'Reis', quantity: 100, unit: 'g' }],
      steps: ['Reis garen.'],
    },
  ],
  shoppingList: [],
  totalCostCents: 1234,
  remainingBudgetCents: 2795,
  currency: 'EUR',
  priceType: 'test',
  priceNotice: 'Fiktive Testpreise.',
};
let http: HttpTestingController;
let session: SessionStore;
let workspace: RecipeWorkspace;

beforeEach(() => {
  sessionStorage.clear();
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withInterceptors([authInterceptor])),
      provideHttpClientTesting(),
      provideRouter([]),
    ],
  });
  http = TestBed.inject(HttpTestingController);
  session = TestBed.inject(SessionStore);
  session.setToken(token());
  session.confirm(user);
  workspace = TestBed.inject(RecipeWorkspace);
  TestBed.tick();
});
afterEach(() => {
  http.verify();
  TestBed.resetTestingModule();
  sessionStorage.clear();
  vi.useRealTimers();
});
function validForm() {
  workspace.form.patchValue({
    supermarket: 'rewe',
    budgetEuros: '40,29',
    persons: 1,
    lifeSituation: 'student',
    diet: 'vegan',
    allergies: ['gluten'],
    excludedIngredients: ['milk'],
    maxCookingTimeMinutes: 30,
    recipeCount: 3,
  });
}

describe('recipe input contract', () => {
  it('converts decimal strings to exact cents without float rounding', () => {
    for (const [value, cents] of [
      ['0,01', 1],
      ['0,29', 29],
      ['40', 4000],
      ['40.2', 4020],
      [' 40,29 ', 4029],
      ['1000,00', 100000],
    ] as const)
      expect(euroToCents(value)).toBe(cents);
  });
  it('rejects ambiguous, out-of-range, fractional-cent and malformed budgets', () => {
    for (const value of [
      '',
      '0',
      '-1',
      '1000,01',
      '1.000,00',
      '1,234',
      '1e2',
      'Infinity',
      '€40',
      '1,',
      '.50',
      '1 000',
    ])
      expect(euroToCents(value)).toBeNull();
  });
  it('enforces integer boundaries for people, cooking time and recipe count', () => {
    const form = createRecipeForm();
    for (const value of [0, 11, 1.5]) {
      form.controls.persons.setValue(value);
      expect(form.controls.persons.invalid).toBe(true);
    }
    for (const value of [4, 181, 10.5]) {
      form.controls.maxCookingTimeMinutes.setValue(value);
      expect(form.controls.maxCookingTimeMinutes.invalid).toBe(true);
    }
    for (const value of [0, 8, 2.5]) {
      form.controls.recipeCount.setValue(value);
      expect(form.controls.recipeCount.invalid).toBe(true);
    }
  });
  it('rejects duplicate/unknown allergens and unknown exclusions', () => {
    const form = createRecipeForm();
    form.controls.allergies.setValue(['milk', 'milk']);
    expect(form.controls.allergies.invalid).toBe(true);
    form.controls.allergies.setValue(['unknown' as never]);
    expect(form.controls.allergies.invalid).toBe(true);
    form.controls.excludedIngredients.setValue(['unknown' as never]);
    expect(form.controls.excludedIngredients.invalid).toBe(true);
  });
  it('keeps inputs while navigating steps and prevents advancing invalid input', () => {
    expect(workspace.next()).toBe(false);
    expect(workspace.step()).toBe(0);
    validForm();
    expect(workspace.next()).toBe(true);
    expect(workspace.next()).toBe(true);
    workspace.back(0);
    expect(workspace.form.controls.budgetEuros.value).toBe('40,29');
    expect(workspace.form.controls.allergies.value).toEqual(['gluten']);
  });
});

describe('recipe request lifecycle', () => {
  it('sends exact request values and bearer once even on duplicate submit', () => {
    validForm();
    workspace.generate();
    workspace.generate();
    const request = http.expectOne('/api/recipes/generate');
    expect(request.request.headers.get('Authorization')).toBe('Bearer ' + session.token());
    expect(request.request.body).toEqual({
      supermarket: 'rewe',
      weeklyBudgetCents: 4029,
      persons: 1,
      lifeSituation: 'student',
      diet: 'vegan',
      allergies: ['gluten'],
      excludedIngredients: ['milk'],
      maxCookingTimeMinutes: 30,
      recipeCount: 3,
    });
    expect(workspace.busy()).toBe(true);
    expect(workspace.form.disabled).toBe(true);
    request.flush(result);
    expect(workspace.result()).toEqual(result);
    expect(workspace.busy()).toBe(false);
    expect(workspace.form.enabled).toBe(true);
  });
  it('does not send invalid input', () => {
    workspace.generate();
    http.expectNone('/api/recipes/generate');
    expect(workspace.form.touched).toBe(true);
  });
  it('preserves input after upstream failure and never retries automatically', () => {
    validForm();
    workspace.generate();
    http
      .expectOne('/api/recipes/generate')
      .flush({}, { status: 422, statusText: 'Unprocessable Entity' });
    expect(workspace.form.controls.budgetEuros.value).toBe('40,29');
    expect(workspace.error()).toContain('keine passende');
    expect(workspace.result()).toBeNull();
    expect(workspace.busy()).toBe(false);
    http.expectNone('/api/recipes/generate');
    workspace.generate();
    http.expectOne('/api/recipes/generate').flush(result);
    expect(workspace.result()).toEqual(result);
  });
  it('bounds waiting at 70 seconds without repeating the AI request', () => {
    vi.useFakeTimers();
    validForm();
    workspace.generate();
    const request = http.expectOne('/api/recipes/generate');
    vi.advanceTimersByTime(70001);
    expect(request.cancelled).toBe(true);
    expect(workspace.busy()).toBe(false);
    expect(workspace.error()).toContain('zu lange');
    http.expectNone('/api/recipes/generate');
  });
  it('clears all request data on explicit new request and logout', () => {
    validForm();
    workspace.generate();
    http.expectOne('/api/recipes/generate').flush(result);
    workspace.reset();
    expect(workspace.result()).toBeNull();
    expect(workspace.form.controls.budgetEuros.value).toBe('');
    expect(workspace.form.controls.allergies.value).toEqual([]);
    validForm();
    session.clear();
    TestBed.tick();
    expect(workspace.form.controls.budgetEuros.value).toBe('');
  });
  it('cancels pending HTTP requests on logout', () => {
    validForm();
    workspace.generate();
    const request = http.expectOne('/api/recipes/generate');
    session.clear();
    TestBed.tick();
    expect(request.cancelled).toBe(true);
    expect(workspace.busy()).toBe(false);
    expect(workspace.result()).toBeNull();
  });
  it('keeps a draft across expiry only for the same user and drops results', () => {
    validForm();
    workspace.generate();
    http.expectOne('/api/recipes/generate').flush(result);
    session.clear(true);
    TestBed.tick();
    expect(workspace.form.controls.budgetEuros.value).toBe('40,29');
    expect(workspace.result()).toBeNull();
    session.setToken(token('again'));
    session.confirm(user);
    TestBed.tick();
    expect(workspace.form.controls.budgetEuros.value).toBe('40,29');
    session.clear(true);
    TestBed.tick();
    session.setToken(token('other'));
    session.confirm({ ...user, id: 'other' });
    TestBed.tick();
    expect(workspace.form.controls.budgetEuros.value).toBe('');
  });
  it('cancels a pending request when the session token changes', () => {
    validForm();
    workspace.generate();
    const request = http.expectOne('/api/recipes/generate');
    session.setToken(token('new'));
    session.confirm(user);
    TestBed.tick();
    expect(request.cancelled).toBe(true);
    expect(workspace.busy()).toBe(false);
  });
  it('editing a result retains values and clears the previous result', () => {
    validForm();
    workspace.generate();
    http.expectOne('/api/recipes/generate').flush(result);
    workspace.edit();
    expect(workspace.result()).toBeNull();
    expect(workspace.step()).toBe(0);
    expect(workspace.form.controls.budgetEuros.value).toBe('40,29');
  });
  it('never persists recipe parameters or results in browser storage', () => {
    validForm();
    workspace.generate();
    http.expectOne('/api/recipes/generate').flush(result);
    expect(sessionStorage.length).toBe(1);
    expect(sessionStorage.getItem('kochfaul.accessToken')).toBe(session.token());
    expect(localStorage.length).toBe(0);
  });
  it('provides helpful errors without exposing backend details', () => {
    for (const status of [400, 401, 422, 429, 502, 503, 504, 0])
      expect(
        recipeErrorMessage(
          new HttpErrorResponse({ status, error: { message: 'secret-backend-detail' } }),
        ),
      ).not.toContain('secret-backend-detail');
    expect(recipeErrorMessage(new HttpErrorResponse({ status: 429 }))).toContain('Minute');
  });
});

describe('temporary shopping checks', () => {
  const shoppingResult: RecipeResult = {
    ...result,
    shoppingList: [
      {
        product: {
          id: 'rice',
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
    remainingBudgetCents: 3631,
  };
  function generate() {
    validForm();
    workspace.generate();
    http.expectOne('/api/recipes/generate').flush(shoppingResult);
  }
  it('checks known products without changing backend quantities, prices or budget', () => {
    generate();
    workspace.setPurchased('rice', true);
    workspace.setPurchased('unknown', true);
    expect([...workspace.checkedProductIds()]).toEqual(['rice']);
    expect(workspace.result()).toEqual(shoppingResult);
    workspace.setPurchased('rice', false);
    expect(workspace.checkedProductIds().size).toBe(0);
    expect(sessionStorage.length).toBe(1);
    expect(localStorage.length).toBe(0);
  });
  it('clears checks when editing and when the next selection contains the same product', () => {
    generate();
    workspace.setPurchased('rice', true);
    workspace.edit();
    expect(workspace.checkedProductIds().size).toBe(0);
    generate();
    workspace.setPurchased('rice', true);
    generate();
    expect(workspace.checkedProductIds().size).toBe(0);
    workspace.setPurchased('rice', true);
    workspace.reset();
    expect(workspace.checkedProductIds().size).toBe(0);
  });
  it('drops checks on expiry and logout', () => {
    generate();
    workspace.setPurchased('rice', true);
    session.clear(true);
    TestBed.tick();
    expect(workspace.checkedProductIds().size).toBe(0);
    session.setToken(token());
    session.confirm(user);
    TestBed.tick();
    generate();
    workspace.setPurchased('rice', true);
    session.clear();
    TestBed.tick();
    expect(workspace.checkedProductIds().size).toBe(0);
  });
});
