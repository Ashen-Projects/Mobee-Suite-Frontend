import type { PropsWithChildren, ReactNode } from "react";
import { Navigate } from "react-router";
import { PATH_AFTER_LOGIN } from "../config";
import useAuth from "../hooks/useAuth";

type GuestGuardProps = PropsWithChildren<{
  loadingFallback?: ReactNode;
}>;

export default function GuestGuard({
  children,
  loadingFallback = null,
}: GuestGuardProps) {
  const { isAuthenticated, status } = useAuth();

  if (status === "loading") return loadingFallback;
  if (isAuthenticated) return <Navigate replace to={PATH_AFTER_LOGIN} />;

  return children;
}

