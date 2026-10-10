export function safeReturnUrl(value: string | null): string {
  return value === '/vorrat' ||
    value === '/rezepte' ||
    value === '/gespeichert' ||
    /^\/gespeichert\/[a-f\d]{24}$/i.test(value ?? '')
    ? value!
    : '/rezepte';
}
