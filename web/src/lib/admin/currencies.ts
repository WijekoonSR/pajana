// Currencies offered for price lines. Must match CURRENCIES in api/src/admin/pricing/pricing.dto.ts.
// Amounts are entered as-is in the chosen currency; nothing is converted.
export const CURRENCIES = [
  { code: "JPY", name: "Japanese yen" },
  { code: "USD", name: "US dollar" },
  { code: "TWD", name: "New Taiwan dollar" },
  { code: "CNY", name: "Chinese yuan" },
  { code: "HKD", name: "Hong Kong dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British pound" },
  { code: "KRW", name: "South Korean won" },
  { code: "SGD", name: "Singapore dollar" },
  { code: "AUD", name: "Australian dollar" },
  { code: "THB", name: "Thai baht" },
] as const;
