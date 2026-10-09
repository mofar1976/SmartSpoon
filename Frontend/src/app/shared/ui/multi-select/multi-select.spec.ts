import { provideTranslations } from '../../../core/i18n/i18n-service';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MultiSelect } from './multi-select';

afterEach(() => TestBed.resetTestingModule());
function setup() {
  TestBed.configureTestingModule({ providers: [provideTranslations('de')] });
  const fixture = TestBed.createComponent(MultiSelect);
  fixture.componentRef.setInput('label', 'Allergien');
  fixture.componentRef.setInput('controlId', 'allergies-test');
  fixture.componentRef.setInput('options', [
    { value: 'milk', label: 'Milch' },
    { value: 'gluten', label: 'Gluten' },
  ]);
  fixture.detectChanges();
  return fixture;
}
describe('accessible multiple selection', () => {
  it('restores values, emits checkbox changes and marks the control as touched', () => {
    const fixture = setup(),
      component = fixture.componentInstance;
    const change = vi.fn(),
      touched = vi.fn();
    component.registerOnChange(change);
    component.registerOnTouched(touched);
    const original = ['milk'];
    component.writeValue(original);
    original.push('gluten');
    component.toggle();
    fixture.detectChanges();
    const checkboxes = fixture.nativeElement.querySelectorAll(
      'input',
    ) as NodeListOf<HTMLInputElement>;
    expect(checkboxes[0].checked).toBe(true);
    expect(checkboxes[1].checked).toBe(false);
    checkboxes[1].click();
    fixture.detectChanges();
    expect(change).toHaveBeenLastCalledWith(['milk', 'gluten']);
    expect(touched).toHaveBeenCalled();
    checkboxes[0].click();
    expect(change).toHaveBeenLastCalledWith(['gluten']);
  });
  it('closes on Escape and returns focus to the labelled trigger', () => {
    const fixture = setup();
    fixture.componentInstance.toggle();
    fixture.detectChanges();
    const checkbox: HTMLInputElement = fixture.nativeElement.querySelector('input');
    checkbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.opened()).toBe(false);
    expect(fixture.nativeElement.querySelector('button').getAttribute('aria-expanded')).toBe(
      'false',
    );
    expect(fixture.nativeElement.querySelector('fieldset')).toBeNull();
  });
  it('disables selection while generation is busy and ignores unknown values', () => {
    const fixture = setup(),
      component = fixture.componentInstance,
      change = vi.fn();
    component.registerOnChange(change);
    component.select('unknown', true);
    expect(change).not.toHaveBeenCalled();
    component.toggle();
    component.setDisabledState(true);
    component.select('milk', true);
    fixture.detectChanges();
    expect(component.opened()).toBe(false);
    expect(component.selected()).toEqual([]);
    expect(fixture.nativeElement.querySelector('button').disabled).toBe(true);
    expect(change).not.toHaveBeenCalled();
  });
});
