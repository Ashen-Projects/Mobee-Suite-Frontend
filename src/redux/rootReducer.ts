import { combineReducers } from "@reduxjs/toolkit";
import { persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import loading from "./slices/loadingSlice";
import ProductRedux from "./slices/productRedux/productRedux";
import SupplierRedux from "./slices/purchaseRedux/supplierRedux";
import PurchaseOrderRedux from "./slices/purchaseRedux/purchaseOrderRedux";
import GrnRedux from "./slices/purchaseRedux/grnRedux";
import BusinessSettingsRedux from "./slices/settingsRedux/businessSettingsRedux";
import SaleRedux from "./slices/posRedux/saleRedux";
import RolePermissionRedux from "./slices/userManagementRedux/rolePermissionRedux";
import UserManagementRedux from "./slices/userManagementRedux/userManagementRedux";

const rootPersistConfig = {
  key: "root",
  keyPrefix: "redux-",
  storage,
  whitelist: [],
};

const rootReducer = combineReducers({
  loading,
  product: persistReducer({ key: "product", storage }, ProductRedux),
  sale: persistReducer({ key: "sale", storage }, SaleRedux),
  purchaseOrder: persistReducer({ key: "purchaseOrder", storage }, PurchaseOrderRedux),
  grn: persistReducer({ key: "grn", storage }, GrnRedux),
  rolePermission: persistReducer({ key: "rolePermission", storage }, RolePermissionRedux),
  supplier: persistReducer({ key: "supplier", storage }, SupplierRedux),
  businessSettings: persistReducer({ key: "businessSettings", storage }, BusinessSettingsRedux),
  userManagement: UserManagementRedux,
});

export { rootPersistConfig, rootReducer };
