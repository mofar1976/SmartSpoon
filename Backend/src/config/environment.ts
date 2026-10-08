export function validateEnvironment(config: Record<string, unknown>) {
  const port = Number(config.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT muss eine ganze Zahl zwischen 1 und 65535 sein.');
  }
  const uri = config.MONGODB_URI;
  if (typeof uri !== 'string' || !/^mongodb(?:\+srv)?:\/\/\S+$/.test(uri)) {
    throw new Error('MONGODB_URI muss eine gültige MongoDB-Verbindungsadresse sein.');
  }
  if (typeof config.JWT_SECRET !== 'string' || config.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET muss mindestens 32 Zeichen lang sein.');
  }
  const model = config.GEMINI_MODEL ?? 'gemini-3.5-flash-lite';
  if (typeof model !== 'string' || !/^gemini-[a-z0-9.-]+$/.test(model)) throw new Error('GEMINI_MODEL ist ungültig.');
  if (config.GEMINI_API_KEY !== undefined && typeof config.GEMINI_API_KEY !== 'string') throw new Error('GEMINI_API_KEY muss eine Zeichenfolge sein.');
  return { ...config, GEMINI_MODEL: model, GEMINI_API_KEY: typeof config.GEMINI_API_KEY === 'string' ? config.GEMINI_API_KEY.trim() : '', PORT: port, MONGODB_URI: uri };
}
