import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { pantryErrorKey } from './pantry-errors';
describe('pantry error messages', () => {
  it('distinguishes an invalid photo model response from an unreachable service', () => {
    expect(
      pantryErrorKey(
        new HttpErrorResponse({ status: 502, error: { code: 'INVALID_MODEL_RESULT' } }),
        'analysis',
      ),
    ).toBe('pantry.errorRecognitionResult');
    expect(
      pantryErrorKey(
        new HttpErrorResponse({ status: 503, error: { code: 'MODEL_UNAVAILABLE' } }),
        'analysis',
      ),
    ).toBe('pantry.errorRecognitionUnavailable');
    expect(
      pantryErrorKey(
        new HttpErrorResponse({ status: 503, error: { code: 'RECOGNITION_NOT_CONFIGURED' } }),
        'analysis',
      ),
    ).toBe('pantry.errorRecognitionSetup');
    expect(pantryErrorKey(new HttpErrorResponse({ status: 0 }), 'analysis')).toBe(
      'pantry.errorConnection',
    );
  });
  it('keeps recipe failures, rejected images and timeouts distinct', () => {
    expect(pantryErrorKey(new HttpErrorResponse({ status: 502 }), 'generation')).toBe(
      'pantry.errorRecipeResult',
    );
    expect(pantryErrorKey(new HttpErrorResponse({ status: 422 }), 'generation')).toBe(
      'pantry.errorNoRecipes',
    );
    expect(pantryErrorKey(new HttpErrorResponse({ status: 422 }), 'analysis')).toBe(
      'pantry.errorInvalid',
    );
    expect(pantryErrorKey(new HttpErrorResponse({ status: 504 }), 'analysis')).toBe(
      'pantry.errorTimeout',
    );
    expect(pantryErrorKey(new TimeoutError(), 'analysis')).toBe('pantry.errorTimeout');
  });
});
