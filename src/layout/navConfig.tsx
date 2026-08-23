import type { ReactNode } from "react";
import {
  BoxCubeIcon,
  DollarLineIcon,
  GridIcon,
  GroupIcon,
  ListIcon,
  PageIcon,
  PieChartIcon,
  PlugInIcon,
  TableIcon,
  UserCircleIcon,
} from "../icons";
import { PATH_DASHBOARD } from "../routes/paths";

export type NavItem = {
  icon: ReactNode;
  name: string;
  path?: string;
  subItems?: { name: string; path: string }[];
};

export const navItems: NavItem[] = [
  { icon: <GridIcon />, name: "Dashboard", path: PATH_DASHBOARD.dashboard.root },
  {
    icon: <DollarLineIcon />,
    name: "Point of Sale",
    subItems: [
      { name: "New Sale", path: PATH_DASHBOARD.pos.newSale },
      { name: "Sales List", path: PATH_DASHBOARD.pos.sales },
      { name: "Sale Returns", path: PATH_DASHBOARD.pos.returns },
      { name: "Refunds", path: PATH_DASHBOARD.pos.refunds },
    ],
  },
  {
    icon: <GroupIcon />,
    name: "Customers",
    subItems: [{ name: "Customer List", path: PATH_DASHBOARD.customers.list }],
  },
  {
    icon: <BoxCubeIcon />,
    name: "Products",
    subItems: [
      { name: "Product List", path: PATH_DASHBOARD.products.list },
      { name: "Categories", path: PATH_DASHBOARD.products.categories },
      { name: "Attributes", path: PATH_DASHBOARD.products.attributes },
    ],
  },
  {
    icon: <TableIcon />,
    name: "Inventory",
    subItems: [
      { name: "Stock Overview", path: PATH_DASHBOARD.inventory.overview },
      { name: "Stock Adjustments", path: PATH_DASHBOARD.inventory.adjustments },
      { name: "Stock Transfers", path: PATH_DASHBOARD.inventory.transfers },
      { name: "Stock Logs", path: PATH_DASHBOARD.inventory.logs },
    ],
  },
  {
    icon: <PageIcon />,
    name: "Purchasing",
    subItems: [
      { name: "Suppliers", path: PATH_DASHBOARD.purchasing.suppliers },
      { name: "Purchase Orders", path: PATH_DASHBOARD.purchasing.orders },
      { name: "Goods Received Notes", path: PATH_DASHBOARD.purchasing.goodsReceivedNotes },
      { name: "Purchase Returns", path: PATH_DASHBOARD.purchasing.returns },
      { name: "Supplier Invoices", path: PATH_DASHBOARD.purchasing.invoices },
      { name: "Supplier Payments", path: PATH_DASHBOARD.purchasing.payments },
    ],
  },
  {
    icon: <PlugInIcon />,
    name: "Repairs",
    subItems: [
      { name: "Repair Jobs", path: PATH_DASHBOARD.repairs.jobs },
      { name: "Repair Payments", path: PATH_DASHBOARD.repairs.payments },
    ],
  },
  {
    icon: <PieChartIcon />,
    name: "Reports",
    subItems: [
      { name: "Sales Report", path: PATH_DASHBOARD.reports.sales },
      { name: "Inventory Report", path: PATH_DASHBOARD.reports.inventory },
      { name: "Purchasing Report", path: PATH_DASHBOARD.reports.purchasing },
      { name: "Repair Report", path: PATH_DASHBOARD.reports.repairs },
    ],
  },
  {
    icon: <UserCircleIcon />,
    name: "User Management",
    subItems: [
      { name: "User List", path: PATH_DASHBOARD.userManagement.users },
      { name: "Roles", path: PATH_DASHBOARD.userManagement.roles },
      { name: "Role Permissions", path: PATH_DASHBOARD.userManagement.rolePermissions },
    ],
  },
  {
    icon: <ListIcon />,
    name: "Settings",
    subItems: [
      { name: "Locations", path: PATH_DASHBOARD.settings.locations },
      { name: "Document Sequences", path: PATH_DASHBOARD.settings.documentSequences },
      { name: "My Profile", path: PATH_DASHBOARD.settings.profile },
    ],
  },
];
