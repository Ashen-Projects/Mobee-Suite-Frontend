import { createSlice } from "@reduxjs/toolkit";

type LoadingState = {
  activeRequests: number;
};

const initialState: LoadingState = {
  activeRequests: 0,
};

const loadingSlice = createSlice({
  name: "loading",
  initialState,
  reducers: {
    finishRequest: (state) => {
      state.activeRequests = Math.max(0, state.activeRequests - 1);
    },
    startRequest: (state) => {
      state.activeRequests += 1;
    },
  },
});

export const { finishRequest, startRequest } = loadingSlice.actions;
export default loadingSlice.reducer;
