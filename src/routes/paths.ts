import { USER_ACCESS, USER_PERMISSIONS } from "../utils";

const path = (root: string, sublink: string): string => `${root}${sublink}`;

const ROOTS_AUTH = "/auth";
const ROOTS_DASHBOARD = "/dashboard";

export const PATH_AUTH = {
  root: ROOTS_AUTH,
  login: path(ROOTS_AUTH, "/login"),
} as const;

export const PATH_PAGE = {
  notFound: "/404",
  pending: "/pending",
  unauthorized: "/403",
} as const;

export const PATH_DASHBOARD = {
  root: ROOTS_DASHBOARD,
  dashboard: {
    root: path(ROOTS_DASHBOARD, "/home"),
  },
  pos: {
    root: path(ROOTS_DASHBOARD, "/pos"),
    newSale: path(ROOTS_DASHBOARD, "/pos/new-sale"),
    sales: path(ROOTS_DASHBOARD, "/pos/sales"),
    returns: path(ROOTS_DASHBOARD, "/pos/returns"),
    refunds: path(ROOTS_DASHBOARD, "/pos/refunds"),
  },
  customers: {
    root: path(ROOTS_DASHBOARD, "/customers"),
    list: path(ROOTS_DASHBOARD, "/customers/list"),
  },
  products: {
    root: path(ROOTS_DASHBOARD, "/products"),
    list: path(ROOTS_DASHBOARD, "/products/list"),
    categories: path(ROOTS_DASHBOARD, "/products/categories"),
    attributes: path(ROOTS_DASHBOARD, "/products/attributes"),
  },
  inventory: {
    root: path(ROOTS_DASHBOARD, "/inventory"),
    overview: path(ROOTS_DASHBOARD, "/inventory/overview"),
    stocks: path(ROOTS_DASHBOARD, "/inventory/stocks"),
    adjustments: path(ROOTS_DASHBOARD, "/inventory/adjustments"),
    transfers: path(ROOTS_DASHBOARD, "/inventory/transfers"),
    logs: path(ROOTS_DASHBOARD, "/inventory/logs"),
  },
  purchasing: {
    root: path(ROOTS_DASHBOARD, "/purchasing"),
    suppliers: path(ROOTS_DASHBOARD, "/purchasing/suppliers"),
    orders: path(ROOTS_DASHBOARD, "/purchasing/orders"),
    goodsReceivedNotes: path(ROOTS_DASHBOARD, "/purchasing/goods-received-notes"),
    grnCounts: path(ROOTS_DASHBOARD, "/purchasing/grn-counts"),
    grnFinalApproval: path(ROOTS_DASHBOARD, "/purchasing/grn-final-approval"),
    returns: path(ROOTS_DASHBOARD, "/purchasing/returns"),
    invoices: path(ROOTS_DASHBOARD, "/purchasing/invoices"),
    payments: path(ROOTS_DASHBOARD, "/purchasing/payments"),
  },
  repairs: {
    root: path(ROOTS_DASHBOARD, "/repairs"),
    jobs: path(ROOTS_DASHBOARD, "/repairs/jobs"),
    payments: path(ROOTS_DASHBOARD, "/repairs/payments"),
    status: path(ROOTS_DASHBOARD, "/repair-status"),
  },
  reports: {
    root: path(ROOTS_DASHBOARD, "/reports"),
    sales: path(ROOTS_DASHBOARD, "/reports/sales"),
    inventory: path(ROOTS_DASHBOARD, "/reports/inventory"),
    purchasing: path(ROOTS_DASHBOARD, "/reports/purchasing"),
    repairs: path(ROOTS_DASHBOARD, "/reports/repairs"),
  },
  notifications: path(ROOTS_DASHBOARD, "/notifications"),
  userManagement: {
    root: path(ROOTS_DASHBOARD, "/user-management"),
    users: path(ROOTS_DASHBOARD, "/user-management/users"),
    roles: path(ROOTS_DASHBOARD, "/user-management/roles"),
  },
  settings: {
    root: path(ROOTS_DASHBOARD, "/settings"),
    locations: path(ROOTS_DASHBOARD, "/settings/locations"),
    documentSequences: path(ROOTS_DASHBOARD, "/settings/document-sequences"),
    dashboardControls: path(ROOTS_DASHBOARD, "/settings/dashboard-controls"),
    profile: path(ROOTS_DASHBOARD, "/settings/profile"),
  },
  demo: {
    calendar: path(ROOTS_DASHBOARD, "/demo/calendar"),
    blank: path(ROOTS_DASHBOARD, "/demo/blank"),
    formElements: path(ROOTS_DASHBOARD, "/demo/form-elements"),
    basicTables: path(ROOTS_DASHBOARD, "/demo/basic-tables"),
    alerts: path(ROOTS_DASHBOARD, "/demo/alerts"),
    avatars: path(ROOTS_DASHBOARD, "/demo/avatars"),
    badges: path(ROOTS_DASHBOARD, "/demo/badges"),
    buttons: path(ROOTS_DASHBOARD, "/demo/buttons"),
    images: path(ROOTS_DASHBOARD, "/demo/images"),
    videos: path(ROOTS_DASHBOARD, "/demo/videos"),
    lineChart: path(ROOTS_DASHBOARD, "/demo/line-chart"),
    barChart: path(ROOTS_DASHBOARD, "/demo/bar-chart"),
  },
} as const;

const generalDataRoutes = [
  PATH_DASHBOARD.settings.profile,
] as const;

export const ROUTE_PERMISSIONS: Readonly<Record<string, readonly string[]>> = {
  ...Object.fromEntries(generalDataRoutes.map((route) => [route, [USER_ACCESS.GENERAL_DATA]])),
  [PATH_DASHBOARD.dashboard.root]: [USER_PERMISSIONS.DASHBOARD_VIEW],
  [PATH_DASHBOARD.userManagement.users]: [USER_PERMISSIONS.USERS_VIEW],
  [PATH_DASHBOARD.userManagement.roles]: [USER_PERMISSIONS.ROLES_VIEW],
  [PATH_DASHBOARD.customers.list]: [USER_PERMISSIONS.CUSTOMERS_VIEW],
  [PATH_DASHBOARD.customers.root]: [USER_PERMISSIONS.CUSTOMERS_VIEW],
  [PATH_DASHBOARD.pos.root]: [USER_PERMISSIONS.SALES_CREATE],
  [PATH_DASHBOARD.pos.newSale]: [USER_PERMISSIONS.SALES_CREATE],
  [PATH_DASHBOARD.pos.sales]: [USER_PERMISSIONS.SALES_VIEW],
  [PATH_DASHBOARD.products.list]: [USER_PERMISSIONS.PRODUCTS_VIEW],
  [PATH_DASHBOARD.products.categories]: [USER_PERMISSIONS.PRODUCT_CATEGORIES_VIEW],
  [PATH_DASHBOARD.products.attributes]: [USER_PERMISSIONS.PRODUCT_ATTRIBUTES_VIEW],
  [PATH_DASHBOARD.inventory.overview]: [USER_PERMISSIONS.STOCK_VIEW],
  [PATH_DASHBOARD.inventory.stocks]: [USER_PERMISSIONS.STOCK_VIEW],
  [PATH_DASHBOARD.repairs.jobs]: [USER_PERMISSIONS.REPAIRS_VIEW],
  [PATH_DASHBOARD.settings.profile]: [USER_ACCESS.GENERAL_DATA],
  [PATH_DASHBOARD.purchasing.suppliers]: [USER_PERMISSIONS.SUPPLIERS_VIEW],
  [PATH_DASHBOARD.purchasing.orders]: [USER_PERMISSIONS.PURCHASE_ORDERS_VIEW],
  [PATH_DASHBOARD.purchasing.goodsReceivedNotes]: [USER_PERMISSIONS.GRNS_VIEW],
  [PATH_DASHBOARD.purchasing.grnCounts]: [USER_PERMISSIONS.GRNS_COUNT],
  [PATH_DASHBOARD.purchasing.grnFinalApproval]: [USER_PERMISSIONS.GRNS_FINANCE_APPROVE],
  [PATH_DASHBOARD.settings.locations]: [USER_PERMISSIONS.LOCATIONS_VIEW],
  [PATH_DASHBOARD.settings.documentSequences]: [USER_PERMISSIONS.DOCUMENT_SEQUENCES_VIEW],
  [PATH_DASHBOARD.settings.dashboardControls]: [USER_PERMISSIONS.DASHBOARD_CONTROLS_VIEW],
  [PATH_DASHBOARD.reports.sales]: [USER_PERMISSIONS.SALES_VIEW],
  [PATH_DASHBOARD.reports.inventory]: [USER_PERMISSIONS.STOCK_VIEW],
  [PATH_DASHBOARD.reports.purchasing]: [USER_PERMISSIONS.GRNS_VIEW],
  [PATH_DASHBOARD.reports.repairs]: [USER_PERMISSIONS.REPAIRS_VIEW],
  [PATH_DASHBOARD.pos.root]: [USER_PERMISSIONS.POS_VIEW],
  [PATH_DASHBOARD.pos.newSale]: [USER_PERMISSIONS.SALES_CREATE],
  [PATH_DASHBOARD.notifications]: [USER_ACCESS.GENERAL_DATA],

};

export const getRoutePermissions = (route: string): readonly string[] =>
  ROUTE_PERMISSIONS[route] ?? [USER_ACCESS.PUBLIC];
