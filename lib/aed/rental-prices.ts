// Rental prices — the single source for every rental number. Kept in its own
// module (no imports) so ./subscription.ts can derive the STANDARD tier from the
// annual plan without an import cycle. Re-exported from ./rental.ts.
export const RENTAL_PRICES = {
  eventFirstDay: 1_500,
  eventNextDay: 900,
  annual: 22_000,
  flexMonthly: 1_990,
  flexMinMonths: 3,
} as const;
