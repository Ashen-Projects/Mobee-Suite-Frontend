export const TIME_ZONE = "Asia/Colombo";
export const DEFAULT_LOCALE = "en-LK";
export const DEFAULT_CURRENCY = "LKR";

export const USER_ACCESS = {
  GENERAL_DATA: "GENERAL_DATA",
  PUBLIC: "PUBLIC",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;

export const USER_ROLES = {
  ADMIN: "admin",
} as const;

export const USER_PERMISSIONS = {
  CUSTOMERS_VIEW: "customers.view",
  INVENTORY_ADJUSTMENTS_VIEW: "inventory.adjustments.view",
  INVENTORY_LOGS_VIEW: "inventory.logs.view",
  INVENTORY_TRANSFERS_VIEW: "inventory.transfers.view",
  INVENTORY_VIEW: "inventory.view",
  LOCATIONS_VIEW: "locations.view",
  POS_VIEW: "pos.view",
  PRODUCT_ATTRIBUTES_VIEW: "product_attributes.view",
  PRODUCT_CATEGORIES_VIEW: "product_categories.view",
  PRODUCTS_VIEW: "products.view",
  PURCHASE_ORDERS_VIEW: "purchase_orders.view",
  PURCHASE_RETURNS_VIEW: "purchase_returns.view",
  REPAIRS_PAYMENTS_VIEW: "repairs.payments.view",
  REPAIRS_VIEW: "repairs.view",
  REPORTS_INVENTORY_VIEW: "reports.inventory.view",
  REPORTS_PURCHASING_VIEW: "reports.purchasing.view",
  REPORTS_REPAIRS_VIEW: "reports.repairs.view",
  REPORTS_SALES_VIEW: "reports.sales.view",
  ROLES_VIEW: "roles.view",
  SALES_REFUNDS_VIEW: "sales.refunds.view",
  SALES_RETURNS_VIEW: "sales.returns.view",
  SALES_VIEW: "sales.view",
  SETTINGS_DOCUMENT_SEQUENCES_VIEW: "settings.document_sequences.view",
  SUPPLIER_INVOICES_VIEW: "supplier_invoices.view",
  SUPPLIER_PAYMENTS_VIEW: "supplier_payments.view",
  SUPPLIERS_VIEW: "suppliers.view",
  USERS_CREATE: "users.create",
  USERS_VIEW: "users.view",
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
