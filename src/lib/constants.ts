export const SUPPORTED_CURRENCIES = [
  "USD", "ETB", "EUR", "GBP", "CAD", "AUD", "JPY", "CNY", "INR",
  "KES", "NGN", "ZAR", "SAR", "AED", "TRY", "BRL", "MXN", "SGD",
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const CURRENCY_LABELS: Record<string, string> = {
  USD: "USD — US Dollar",
  ETB: "ETB — Ethiopian Birr",
  EUR: "EUR — Euro",
  GBP: "GBP — British Pound",
  CAD: "CAD — Canadian Dollar",
  AUD: "AUD — Australian Dollar",
  JPY: "JPY — Japanese Yen",
  CNY: "CNY — Chinese Yuan",
  INR: "INR — Indian Rupee",
  KES: "KES — Kenyan Shilling",
  NGN: "NGN — Nigerian Naira",
  ZAR: "ZAR — South African Rand",
  SAR: "SAR — Saudi Riyal",
  AED: "AED — UAE Dirham",
  TRY: "TRY — Turkish Lira",
  BRL: "BRL — Brazilian Real",
  MXN: "MXN — Mexican Peso",
  SGD: "SGD — Singapore Dollar",
};
