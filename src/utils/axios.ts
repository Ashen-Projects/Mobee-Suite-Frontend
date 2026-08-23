import axios, { AxiosError } from "axios";
import { BASE_URL } from "../config";
import { dispatch } from "../redux/store";
import {
  finishRequest,
  startRequest,
} from "../redux/slices/loadingSlice";

type ApiErrorBody = {
  errors?: unknown;
  message?: string;
};

const MINIMUM_LOADER_DURATION_MS = 400;

export class ApiError extends Error {
  readonly details?: unknown;
  readonly status?: number;

  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  timeout: 120_000,
});

apiClient.interceptors.request.use((config) => {
  if (config.trackLoading !== false) {
    config.loadingStartedAt = Date.now();
    config.loadingTracked = true;
    dispatch(startRequest());
  }

  return config;
});

const finishTrackedRequest = (config?: AxiosError["config"]): void => {
  if (config?.loadingTracked) {
    config.loadingTracked = false;
    const elapsed = Date.now() - (config.loadingStartedAt ?? Date.now());
    const remaining = Math.max(0, MINIMUM_LOADER_DURATION_MS - elapsed);

    window.setTimeout(() => dispatch(finishRequest()), remaining);
  }
};

apiClient.interceptors.response.use(
  (response) => {
    finishTrackedRequest(response.config);
    return response;
  },
  (error: AxiosError<ApiErrorBody>) => {
    finishTrackedRequest(error.config);

    if (error.response?.status === 401) {
      window.dispatchEvent(new CustomEvent("mobee:unauthorized"));
    }

    const message =
      error.response?.data?.message ??
      (error.code === "ECONNABORTED"
        ? "The request timed out."
        : "Unable to communicate with the server.");

    return Promise.reject(
      new ApiError(
        message,
        error.response?.status,
        error.response?.data?.errors,
      ),
    );
  },
);

export default apiClient;
