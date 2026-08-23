import { TIME_ZONE, USER_ACCESS } from "./constants";

export const accessVerify = (
  code: string,
  permissionList: readonly string[] = [],
): boolean =>
  permissionList.includes(code) ||
  permissionList.includes(USER_ACCESS.SUPER_ADMIN);

export const capitalize = (value: string): string => {
  const normalized = value.trim();
  return normalized
    ? normalized.charAt(0).toUpperCase() + normalized.slice(1)
    : "";
};

export const capitalizeAndEndWithPeriod = (value: string): string => {
  const normalized = capitalize(value);
  return normalized && !/[.!?]$/.test(normalized)
    ? `${normalized}.`
    : normalized;
};

export const truncateStringValue = (
  value: string,
  maxLength: number,
): string => {
  if (maxLength < 1) return "";
  return value.length > maxLength
    ? `${value.slice(0, Math.max(0, maxLength - 1))}…`
    : value;
};

export const handleNumber = (
  value: number | string | null | undefined,
  fallback = 0,
): number => {
  if (value === null || value === undefined || value === "") return fallback;
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
};

export const safeJSONParse = <T>(
  value: string | null | undefined,
  fallback: T,
): T => {
  if (value == null) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const padNumber = (value: number, length = 2): string =>
  value.toString().padStart(length, "0");

export const openInNewTab = (url: string): void => {
  window.open(url, "_blank", "noopener,noreferrer");
};

export const formatDate = (
  value: Date | string | number,
  options: Intl.DateTimeFormatOptions = {},
): string =>
  new Intl.DateTimeFormat("en-LK", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: TIME_ZONE,
    ...options,
  }).format(new Date(value));

export const formatTime = (
  value: Date | string | number,
  options: Intl.DateTimeFormatOptions = {},
): string =>
  new Intl.DateTimeFormat("en-LK", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: TIME_ZONE,
    ...options,
  }).format(new Date(value));

export const formatDateTime = (
  value: Date | string | number,
  options: Intl.DateTimeFormatOptions = {},
): string =>
  new Intl.DateTimeFormat("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: TIME_ZONE,
    ...options,
  }).format(new Date(value));
