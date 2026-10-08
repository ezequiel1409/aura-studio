/**
 * Formatea un valor en centavos a pesos argentinos (ARS).
 * Si priceCents es null o undefined, devuelve 'Consultar precio' (BR-23).
 */
export function formatPrice(priceCents: number | null | undefined, currency: string = "ARS"): string {
  if (priceCents === null || priceCents === undefined) {
    return "Consultar precio";
  }

  const amount = priceCents / 100;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

