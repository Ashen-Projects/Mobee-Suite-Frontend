import type { ReactNode } from "react";
import { Navigate, useRoutes } from "react-router";
import AppLayout from "../layout/AppLayout";
import AuthGuard from "../guards/AuthGuard";
import GuestGuard from "../guards/GuestGuard";
import PermissionGuard from "../guards/PermissionGuard";
import SignIn from "../pages/auth/Login";
import PendingAccount from "../pages/auth/PendingAccount";
import Home from "../pages/Dashboard/home/HomeDashboard";
import NotFound from "../pages/errorPages/Page404";
import Unauthorized from "../pages/errorPages/PermissionRequired";
import ModulePlaceholder from "../pages/Dashboard/components/ModulePlaceholder";
import UserList from "../pages/Dashboard/userManagement/UserList";
import Roles from "../pages/Dashboard/userManagement/Roles";
import ProductList from "../pages/Dashboard/products/ProductList";
import Categories from "../pages/Dashboard/products/Categories";
import Attributes from "../pages/Dashboard/products/Attributes";
import Suppliers from "../pages/Dashboard/purchasing/Suppliers";
import PurchaseOrders from "../pages/Dashboard/purchasing/PurchaseOrders";
import GoodsReceivedNotes from "../pages/Dashboard/purchasing/GoodsReceivedNotes";
import StockOverview from "../pages/Dashboard/inventory/StockOverview";
import StockList from "../pages/Dashboard/inventory/StockList";
import PosLanding from "../pages/Dashboard/pos/PosLanding";
import NewSale from "../pages/Dashboard/pos/NewSale";
import SalesList from "../pages/Dashboard/pos/SalesList";
import Locations from "../pages/Dashboard/settings/Locations";
import DocumentSequences from "../pages/Dashboard/settings/DocumentSequences";
import UserProfiles from "../pages/Dashboard/settings/UserProfile";
import Calendar from "../pages/Dashboard/demo/Calendar";
import Blank from "../pages/Dashboard/demo/Blank";
import FormElements from "../pages/Dashboard/demo/FormElements";
import BasicTables from "../pages/Dashboard/demo/BasicTables";
import Alerts from "../pages/Dashboard/demo/Alerts";
import Avatars from "../pages/Dashboard/demo/Avatars";
import Badges from "../pages/Dashboard/demo/Badges";
import Buttons from "../pages/Dashboard/demo/Buttons";
import Images from "../pages/Dashboard/demo/Images";
import Videos from "../pages/Dashboard/demo/Videos";
import LineChart from "../pages/Dashboard/demo/LineChart";
import BarChart from "../pages/Dashboard/demo/BarChart";
import { PATH_AUTH, PATH_DASHBOARD, PATH_PAGE, getRoutePermissions } from "./paths";

const withPermission = (route: string, element: ReactNode) => (
  <PermissionGuard permissions={getRoutePermissions(route)}>{element}</PermissionGuard>
);

const placeholder = (route: string, section: string, title: string, description: string) =>
  withPermission(route, <ModulePlaceholder description={description} section={section} title={title} />);

export default function Router() {
  return useRoutes([
    {
      path: PATH_AUTH.root,
      children: [
        {
          path: "login",
          element: <GuestGuard><SignIn /></GuestGuard>,
        },
      ],
    },
    {
      path: PATH_DASHBOARD.root,
      element: <AuthGuard><AppLayout /></AuthGuard>,
      children: [
        { index: true, element: <Navigate replace to={PATH_DASHBOARD.dashboard.root} /> },
        { path: "home", element: withPermission(PATH_DASHBOARD.dashboard.root, <Home />) },
        {
          path: "pos",
          children: [
            { index: true, element: withPermission(PATH_DASHBOARD.pos.root, <PosLanding />) },
            { path: "new-sale", element: withPermission(PATH_DASHBOARD.pos.newSale, <NewSale />) },
            { path: "sales", element: withPermission(PATH_DASHBOARD.pos.sales, <SalesList />) },
            { path: "returns", element: placeholder(PATH_DASHBOARD.pos.returns, "Point of Sale", "Sale Returns", "Review and manage returned sale items.") },
            { path: "refunds", element: placeholder(PATH_DASHBOARD.pos.refunds, "Point of Sale", "Refunds", "Review and manage customer refunds.") },
          ],
        },
        {
          path: "customers",
          children: [
            { path: "list", element: placeholder(PATH_DASHBOARD.customers.list, "Customers", "Customer List", "View and manage customer records.") },
          ],
        },
        {
          path: "products",
          children: [
            { path: "list", element: withPermission(PATH_DASHBOARD.products.list, <ProductList />) },
            { path: "categories", element: withPermission(PATH_DASHBOARD.products.categories, <Categories />) },
            { path: "attributes", element: withPermission(PATH_DASHBOARD.products.attributes, <Attributes />) },
          ],
        },
        {
          path: "inventory",
          children: [
            { path: "overview", element: withPermission(PATH_DASHBOARD.inventory.overview, <StockOverview />) },
            { path: "stocks", element: withPermission(PATH_DASHBOARD.inventory.stocks, <StockList />) },
            { path: "adjustments", element: placeholder(PATH_DASHBOARD.inventory.adjustments, "Inventory", "Stock Adjustments", "Review and manage stock correction records.") },
            { path: "transfers", element: placeholder(PATH_DASHBOARD.inventory.transfers, "Inventory", "Stock Transfers", "Track stock movements between Mobee locations.") },
            { path: "logs", element: placeholder(PATH_DASHBOARD.inventory.logs, "Inventory", "Stock Logs", "Inspect the complete history of inventory movements.") },
          ],
        },
        {
          path: "purchasing",
          children: [
            { path: "suppliers", element: withPermission(PATH_DASHBOARD.purchasing.suppliers, <Suppliers />) },
            { path: "orders", element: withPermission(PATH_DASHBOARD.purchasing.orders, <PurchaseOrders />) },
            { path: "goods-received-notes", element: withPermission(PATH_DASHBOARD.purchasing.goodsReceivedNotes, <GoodsReceivedNotes workspace="receiving" />) },
            { path: "grn-counts", element: withPermission(PATH_DASHBOARD.purchasing.grnCounts, <GoodsReceivedNotes workspace="counts" />) },
            { path: "grn-final-approval", element: withPermission(PATH_DASHBOARD.purchasing.grnFinalApproval, <GoodsReceivedNotes workspace="finalApproval" />) },
            { path: "returns", element: placeholder(PATH_DASHBOARD.purchasing.returns, "Purchasing", "Purchase Returns", "Review inventory returned to suppliers.") },
            { path: "invoices", element: placeholder(PATH_DASHBOARD.purchasing.invoices, "Purchasing", "Supplier Invoices", "Review invoices received from suppliers.") },
            { path: "payments", element: placeholder(PATH_DASHBOARD.purchasing.payments, "Purchasing", "Supplier Payments", "Track payments made to suppliers.") },
          ],
        },
        {
          path: "repairs",
          children: [
            { path: "jobs", element: placeholder(PATH_DASHBOARD.repairs.jobs, "Repairs", "Repair Jobs", "View and manage customer repair jobs.") },
            { path: "payments", element: placeholder(PATH_DASHBOARD.repairs.payments, "Repairs", "Repair Payments", "Track payments related to repair jobs.") },
          ],
        },
        {
          path: "reports",
          children: [
            { path: "sales", element: placeholder(PATH_DASHBOARD.reports.sales, "Reports", "Sales Report", "Analyze sales performance and transaction trends.") },
            { path: "inventory", element: placeholder(PATH_DASHBOARD.reports.inventory, "Reports", "Inventory Report", "Analyze stock levels and inventory movements.") },
            { path: "purchasing", element: placeholder(PATH_DASHBOARD.reports.purchasing, "Reports", "Purchasing Report", "Analyze supplier and purchasing activity.") },
            { path: "repairs", element: placeholder(PATH_DASHBOARD.reports.repairs, "Reports", "Repair Report", "Analyze repair volume, status, and revenue.") },
          ],
        },
        {
          path: "user-management",
          children: [
            { path: "users", element: withPermission(PATH_DASHBOARD.userManagement.users, <UserList />) },
            { path: "roles", element: withPermission(PATH_DASHBOARD.userManagement.roles, <Roles />) },
          ],
        },
        {
          path: "settings",
          children: [
            { path: "locations", element: withPermission(PATH_DASHBOARD.settings.locations, <Locations />) },
            { path: "document-sequences", element: withPermission(PATH_DASHBOARD.settings.documentSequences, <DocumentSequences />) },
            { path: "profile", element: withPermission(PATH_DASHBOARD.settings.profile, <UserProfiles />) },
          ],
        },
        {
          path: "demo",
          children: [
            { path: "calendar", element: withPermission(PATH_DASHBOARD.demo.calendar, <Calendar />) },
            { path: "blank", element: withPermission(PATH_DASHBOARD.demo.blank, <Blank />) },
            { path: "form-elements", element: withPermission(PATH_DASHBOARD.demo.formElements, <FormElements />) },
            { path: "basic-tables", element: withPermission(PATH_DASHBOARD.demo.basicTables, <BasicTables />) },
            { path: "alerts", element: withPermission(PATH_DASHBOARD.demo.alerts, <Alerts />) },
            { path: "avatars", element: withPermission(PATH_DASHBOARD.demo.avatars, <Avatars />) },
            { path: "badges", element: withPermission(PATH_DASHBOARD.demo.badges, <Badges />) },
            { path: "buttons", element: withPermission(PATH_DASHBOARD.demo.buttons, <Buttons />) },
            { path: "images", element: withPermission(PATH_DASHBOARD.demo.images, <Images />) },
            { path: "videos", element: withPermission(PATH_DASHBOARD.demo.videos, <Videos />) },
            { path: "line-chart", element: withPermission(PATH_DASHBOARD.demo.lineChart, <LineChart />) },
            { path: "bar-chart", element: withPermission(PATH_DASHBOARD.demo.barChart, <BarChart />) },
          ],
        },
      ],
    },
    { path: PATH_PAGE.pending, element: <AuthGuard><PendingAccount /></AuthGuard> },
    { path: PATH_PAGE.unauthorized, element: <AuthGuard><Unauthorized /></AuthGuard> },
    { path: PATH_PAGE.notFound, element: <NotFound /> },
    { path: "/", element: <Navigate replace to={PATH_AUTH.login} /> },
    { path: "*", element: <Navigate replace to={PATH_PAGE.notFound} /> },
  ]);
}
