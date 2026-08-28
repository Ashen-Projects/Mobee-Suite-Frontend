export const TIME_ZONE = "Asia/Colombo";
export const DEFAULT_LOCALE = "en-LK";
export const DEFAULT_CURRENCY = "LKR";

export const USER_ACCESS = {
  GENERAL_DATA: "GENERAL_DATA",
  PUBLIC: "PUBLIC",
} as const;

export const USER_ROLES = {
  ADMIN: "admin",
  PENDING: "pending_user",
} as const;

export const USER_PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard.view",
  PERMISSIONS_CREATE: "permissions.create",
  PERMISSIONS_UPDATE: "permissions.update",
  PERMISSIONS_DELETE: "permissions.delete",
  PRODUCT_ATTRIBUTES_CREATE: "product_attributes.create",
  PRODUCT_ATTRIBUTES_UPDATE: "product_attributes.update",
  PRODUCT_ATTRIBUTES_VIEW: "product_attributes.view",
  PRODUCT_CATEGORIES_CREATE: "product_categories.create",
  PRODUCT_CATEGORIES_UPDATE: "product_categories.update",
  PRODUCT_CATEGORIES_VIEW: "product_categories.view",
  PRODUCTS_CREATE: "products.create",
  PRODUCTS_UPDATE: "products.update",
  PRODUCTS_VIEW: "products.view",
  ROLES_ASSIGN_PERMISSIONS: "roles.assign_permissions",
  ROLES_CREATE: "roles.create",
  ROLES_DELETE: "roles.delete",
  ROLES_UPDATE: "roles.update",
  ROLES_VIEW: "roles.view",
  USERS_ASSIGN_ROLES: "users.assign_roles",
  USERS_CREATE: "users.create",
  USERS_UPDATE: "users.update",
  USERS_VIEW: "users.view",
  CUSTOMER_VIEW: "customer.view",
  SUPPLIERS_VIEW: "suppliers.view",
  SUPPLIERS_CREATE: "suppliers.create",
  SUPPLIERS_UPDATE: "suppliers.update",
  SUPPLIERS_DELETE: "suppliers.delete",
} as const;

export const COLOR_CODE = {
  error: "#d92d20",
  info: "#1570ef",
  primary: "#ffae00",
  success: "#039855",
  warning: "#dc6803",
} as const;

export const STORAGE_KEYS = {
  authToken: "authToken",
  settings: "settings",
  user: "user",
} as const;
