/**
 * Formatea un valor en centavos a pesos argentinos (ARS).
 * Si priceCents es null o undefined, devuelve 'Consultar precio' (BR-23).
 * Si priceCents no es un número finito o es NaN, devuelve '$ 0' de forma segura.
 */
export function formatPrice(priceCents: number | null | undefined, currency: string = "ARS"): string {
  if (priceCents === null || priceCents === undefined) {
    return "Consultar precio";
  }

  const num = typeof priceCents === "number" ? priceCents : Number(priceCents);
  if (Number.isNaN(num) || !Number.isFinite(num)) {
    return "$ 0";
  }

  const amount = num / 100;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export const formatPriceARS = formatPrice;

