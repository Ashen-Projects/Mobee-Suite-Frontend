import { combineReducers } from "@reduxjs/toolkit";
import { persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import loading from "./slices/loadingSlice";
import ProductRedux from "./slices/productRedux/productRedux";
import SupplierRedux from "./slices/purchaseRedux/supplierRedux";
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
  rolePermission: persistReducer({ key: "rolePermission", storage }, RolePermissionRedux),
  supplier: persistReducer({ key: "supplier", storage }, SupplierRedux),
  userManagement: UserManagementRedux,
});

export { rootPersistConfig, rootReducer };
