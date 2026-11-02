/**
-- ==============================================================================
-- Utilidades para manejo de importes monetarios en CENTAVOS
-- ==============================================================================
-- Para evitar errores de coma flotante en JavaScript/TypeScript y bases de datos,
-- todos los montos se almacenan y procesan como números enteros de centavos
-- (ejemplo: $1.500,50 se representa como 150050).
*/

/**
 * Convierte un monto en centavos a un número en pesos (para display/cálculos decimales).
 * Ejemplo: 150050 -> 1500.5
 */
export function centavosToPesos(centavos: number | null | undefined): number {
  if (centavos == null || isNaN(centavos)) return 0;
  return centavos / 100;
}

/**
 * Convierte un número en pesos (decimal) a centavos enteros (redondeado).
 * Ejemplo: 1500.50 -> 150050
 */
export function pesosToCentavos(pesos: number | string | null | undefined): number {
  if (pesos == null) return 0;
  const num = typeof pesos === 'string' ? parseMoneyInput(pesos) : pesos;
  const centavos = Math.round((num + Number.EPSILON) * 100);
  if (!Number.isFinite(num) || !Number.isSafeInteger(centavos)) {
    throw new Error('El importe debe ser un número válido dentro del rango permitido.');
  }
  return centavos;
}

/** Acepta coma o punto decimal y hasta dos decimales; rechaza texto parcial e infinitos. */
export function parseMoneyInput(value: string): number {
  const text = value.trim();
  if (!/^-?\d+(?:[.,]\d{1,2})?$/.test(text)) return NaN;
  const amount = Number(text.replace(',', '.'));
  return Number.isFinite(amount) && Number.isSafeInteger(Math.round(amount * 100)) ? amount : NaN;
}

/**
 * Formatea un importe en centavos como texto de moneda argentina.
 * Ejemplo: 150050 -> "$ 1.500,50"
 */
export function formatCentavos(centavos: number | null | undefined): string {
  const pesos = centavosToPesos(centavos);
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(pesos);
}

/**
 * Formatea un importe directamente desde pesos a formato moneda.
 */
export function formatPesos(pesos: number | null | undefined): string {
  const safe = pesos ?? 0;
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe);
}
