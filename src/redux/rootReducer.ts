import { combineReducers } from "@reduxjs/toolkit";
import loading from "./slices/loadingSlice";

export const rootReducer = combineReducers({
  loading,
});
