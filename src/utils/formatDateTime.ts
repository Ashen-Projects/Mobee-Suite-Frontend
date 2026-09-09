const toDate = (value: unknown): Date | null => {
  if (value === null || value === undefined || value === "") return null;

  const numericValue = typeof value === "number" ? value : Number(value);
  const normalizedValue = Number.isFinite(numericValue)
    ? numericValue > 0 && numericValue < 1_000_000_000_000
      ? numericValue * 1_000
      : numericValue
    : String(value);
  const date = new Date(normalizedValue);

  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDateTime = (value: unknown, fallback = "—"): string => {
  const date = toDate(value);
  if (!date) return fallback;

  return new Intl.DateTimeFormat("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};
