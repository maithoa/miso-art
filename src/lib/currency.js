const EUR_FORMATTER = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })

/** Format integer cents as a localised EUR string, e.g. 1500 → "15,00 €" */
export function formatEUR(cents) {
  return EUR_FORMATTER.format(cents / 100)
}

/** Parse a user-typed euro string to integer cents, e.g. "8.50" → 850 */
export function parseCents(euroString) {
  return Math.round(parseFloat(euroString) * 100)
}
