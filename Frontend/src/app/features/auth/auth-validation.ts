import { AbstractControl, ValidationErrors } from '@angular/forms';

export function berlinToday(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const value = (type: string) => parts.find((part) => part.type === type)!.value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}
export function usernameValidator(control: AbstractControl): ValidationErrors | null {
  const name = String(control.value ?? '')
    .trim()
    .toLowerCase();
  return /^[a-z0-9_-]{3,30}$/.test(name) ? null : { username: true };
}
export function birthDateValidator(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return { birthDate: true };
  const [year, month, day] = value.split('-').map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return year >= 1 &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= days[month - 1] &&
    value <= berlinToday()
    ? null
    : { birthDate: true };
}
