import {
  DEFAULT_CURRENCY,
  DEFAULT_LOCALE,
} from "./constants";

type NumericValue = number | null | undefined;

export const fCurrency = (value: NumericValue): string => {
  if (value == null) return "";

  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    currency: DEFAULT_CURRENCY,
    style: "currency",
  }).format(value);
};

export const fCurrencyWithoutSymbol = (value: NumericValue): string => {
  if (value == null) return "";

  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value);
};

export const fShortenNumber = (value: NumericValue): string => {
  if (value == null) return "";

  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    maximumFractionDigits: 2,
    notation: "compact",
  }).format(value);
};

export const fData = (value: NumericValue): string => {
  if (value == null) return "";
  if (value === 0) return "0 B";

  const unitIndex = Math.min(
    Math.floor(Math.log(Math.abs(value)) / Math.log(1024)),
    4,
  );
  const units = ["B", "KB", "MB", "GB", "TB"];
  const formattedValue = value / 1024 ** unitIndex;

  return `${formattedValue.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

