import type { AxiosRequestConfig } from "axios";
import { toast } from "react-toastify";
import { BASE_URL } from "./config";
import apiClient from "./utils/axios";

export type ApiResponse<T> = {
  data: T;
  message?: string;
  success: boolean;
};

type LoadingOptions = {
  trackLoading?: boolean;
};

const normalizePath = (path: string): string => path.replace(/^\/+/, "");

const requestWithToast = async <T>(
  request: Promise<ApiResponse<T>>,
  pendingMessage: string,
): Promise<ApiResponse<T>> =>
  toast.promise(request, {
    pending: pendingMessage,
    success: {
      render: ({ data }) => data.message ?? "Completed successfully.",
    },
    error: {
      render: ({ data }) =>
        data instanceof Error ? data.message : "The request failed.",
    },
  });

export const get = async <T>(
  path: string,
  queryParams: Record<string, unknown> = {},
  baseUrl = BASE_URL,
  timeout = 120_000,
  { trackLoading = true }: LoadingOptions = {},
): Promise<ApiResponse<T>> => {
  const response = await apiClient.get<ApiResponse<T>>(normalizePath(path), {
    baseURL: baseUrl,
    params: queryParams,
    timeout,
    trackLoading,
  });
  return response.data;
};

const mutationRequest = async <TResponse, TBody>(
  method: "delete" | "patch" | "post" | "put",
  path: string,
  body: TBody,
  baseUrl: string,
  pendingMessage: string,
  usePromiseToast: boolean,
  trackLoading: boolean,
): Promise<ApiResponse<TResponse>> => {
  const execute = apiClient
    .request<ApiResponse<TResponse>>({
      baseURL: baseUrl,
      data: body,
      method,
      trackLoading,
      url: normalizePath(path),
    })
    .then((response) => response.data);

  return usePromiseToast
    ? requestWithToast(execute, pendingMessage)
    : execute;
};

export const post = async <TResponse, TBody = unknown>(
  path: string,
  body: TBody,
  baseUrl = BASE_URL,
  usePromiseToast = true,
  { trackLoading = true }: LoadingOptions = {},
): Promise<ApiResponse<TResponse>> =>
  mutationRequest(
    "post",
    path,
    body,
    baseUrl,
    "Saving...",
    usePromiseToast,
    trackLoading,
  );

export const put = async <TResponse, TBody = unknown>(
  path: string,
  body: TBody,
  baseUrl = BASE_URL,
  usePromiseToast = true,
  { trackLoading = true }: LoadingOptions = {},
): Promise<ApiResponse<TResponse>> =>
  mutationRequest(
    "put",
    path,
    body,
    baseUrl,
    "Updating...",
    usePromiseToast,
    trackLoading,
  );

export const patch = async <TResponse, TBody = unknown>(
  path: string,
  body: TBody,
  baseUrl = BASE_URL,
  usePromiseToast = true,
  { trackLoading = true }: LoadingOptions = {},
): Promise<ApiResponse<TResponse>> =>
  mutationRequest(
    "patch",
    path,
    body,
    baseUrl,
    "Updating...",
    usePromiseToast,
    trackLoading,
  );

export const deleteMethod = async <TResponse, TBody = unknown>(
  path: string,
  body: TBody,
  baseUrl = BASE_URL,
  usePromiseToast = true,
  { trackLoading = true }: LoadingOptions = {},
): Promise<ApiResponse<TResponse>> =>
  mutationRequest(
    "delete",
    path,
    body,
    baseUrl,
    "Deleting...",
    usePromiseToast,
    trackLoading,
  );

export const uploadFile = async <TResponse>(
  path: string,
  formData: FormData,
  config: AxiosRequestConfig = {},
): Promise<ApiResponse<TResponse>> => {
  const response = await apiClient.post<ApiResponse<TResponse>>(
    normalizePath(path),
    formData,
    {
      ...config,
      headers: {
        ...config.headers,
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
};
