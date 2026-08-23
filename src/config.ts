const getEnv = (key: string, fallback: string): string =>
  import.meta.env[key] || fallback;

export const BASE_URL = getEnv(
  "VITE_APP_BASEURL",
  "http://localhost:3000/api/v1/",
);

export const BUSINESS_HORIZONTAL_LOGO = getEnv(
  "VITE_APP_BUSINESS_HORIZONTAL_LOGO",
  "https://res.cloudinary.com/gxsancbf/image/upload/v1787321325/Mobee-suite.png",
);

export const BUSINESS_NAME = getEnv("VITE_APP_BUSINESS_NAME", "Mobee");

export const BUSINESS_VERTICAL_LOGO = getEnv(
  "VITE_APP_BUSINESS_VERTICAL_LOGO",
  "/images/logo/logo-icon.svg",
);

export const ENV = getEnv("VITE_APP_ENV", "DEVELOPMENT");

export const FRONTEND_BASE_URL = window.location.origin;

export const ICON = {
  NAVBAR_ITEM: 22,
  NAVBAR_ITEM_HORIZONTAL: 20,
} as const;

export const HEADER = {
  DASHBOARD_DESKTOP_HEIGHT: 92,
  DASHBOARD_DESKTOP_OFFSET_HEIGHT: 60,
  MAIN_DESKTOP_HEIGHT: 88,
  MOBILE_HEIGHT: 64,
} as const;

export const NAVBAR = {
  BASE_WIDTH: 260,
  DASHBOARD_COLLAPSE_WIDTH: 88,
  DASHBOARD_ITEM_HORIZONTAL_HEIGHT: 32,
  DASHBOARD_ITEM_ROOT_HEIGHT: 48,
  DASHBOARD_ITEM_SUB_HEIGHT: 40,
  DASHBOARD_WIDTH: 280,
} as const;

export const PATH_AFTER_LOGIN = "/dashboard/home";

export const defaultSettings = {
  themeColorPresets: "orange",
  themeDirection: "ltr",
  themeLayout: "vertical",
  themeMode: "light",
  themeStretch: true,
} as const;
