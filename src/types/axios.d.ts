import "axios";

declare module "axios" {
  export interface AxiosRequestConfig {
    trackLoading?: boolean;
  }

  export interface InternalAxiosRequestConfig {
    loadingStartedAt?: number;
    loadingTracked?: boolean;
    trackLoading?: boolean;
  }
}
