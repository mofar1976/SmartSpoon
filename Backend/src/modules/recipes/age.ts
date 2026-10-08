export function ageFromBirthDate(birthDate: string | null, now = new Date()): number | null {
  if (!birthDate) return null;
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = (type: string) => parts.find(p => p.type === type)!.value;
  const currentYear = Number(part('year'));
  const birthdayOccurred = `${part('month')}-${part('day')}` >= birthDate.slice(5);
  return currentYear - Number(birthDate.slice(0, 4)) - (birthdayOccurred ? 0 : 1);
}
