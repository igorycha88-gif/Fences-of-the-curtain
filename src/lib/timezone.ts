export function getMoscowDate(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Moscow' });
}

export function getMoscowDateTime(): string {
  return new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
}
