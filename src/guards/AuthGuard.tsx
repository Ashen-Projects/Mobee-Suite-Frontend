import type { PropsWithChildren, ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { PATH_AUTH } from "../routes/paths";
import useAuth from "../hooks/useAuth";

type AuthGuardProps = PropsWithChildren<{
  loadingFallback?: ReactNode;
}>;

export default function AuthGuard({
  children,
  loadingFallback = null,
}: AuthGuardProps) {
  const { isAuthenticated, status } = useAuth();
  const location = useLocation();

  if (status === "loading") return loadingFallback;

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to={PATH_AUTH.login} />;
  }

  return children;
}
