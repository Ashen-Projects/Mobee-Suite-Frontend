import { safeJSONParse } from "./common";

export const readLocalStorage = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const writeLocalStorage = (key: string, value: string): boolean => {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

export const removeLocalStorage = (key: string): boolean => {
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};

export const readJsonLocalStorage = <T>(key: string, fallback: T): T =>
  safeJSONParse<T>(readLocalStorage(key), fallback);

export const writeJsonLocalStorage = <T>(key: string, value: T): boolean =>
  writeLocalStorage(key, JSON.stringify(value));

