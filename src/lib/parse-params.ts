/**
 * Безопасный парсинг строкового значения в целое число
 * 
 * @param value - Строка для парсинга или null
 * @param fallback - Значение по умолчанию при ошибке
 * @returns Валидное целое число (никогда NaN или отрицательное)
 * 
 * @example
 * safeParseInt('42', 1)     // → 42
 * safeParseInt(null, 1)     // → 1
 * safeParseInt('abc', 1)    // → 1
 * safeParseInt('-5', 1)     // → 1
 * safeParseInt('0', 1)      // → 0 (ноль валиден)
 */
export function safeParseInt(value: string | null, fallback: number): number {
  const parsed = parseInt(value ?? '', 10)
  return isNaN(parsed) || parsed < 0 ? fallback : parsed
}

/**
 * Безопасный парсинг с ограничением максимального значения
 * Полезно для pageSize чтобы предотвратить слишком большие выборки
 * 
 * @param value - Строка для парсинга или null
 * @param fallback - Значение по умолчанию
 * @param max - Максимальное допустимое значение
 * @returns Валидное целое число в диапазоне [0, max]
 * 
 * @example
 * safeParseIntWithMax('1000', 20, 100)  // → 100 (ограничено max)
 * safeParseIntWithMax('50', 20, 100)    // → 50
 */
export function safeParseIntWithMax(
  value: string | null,
  fallback: number,
  max: number
): number {
  const parsed = safeParseInt(value, fallback)
  return Math.min(parsed, max)
}
