import type { PropsWithChildren, ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { PATH_AUTH, PATH_PAGE } from "../routes/paths";
import useAuth from "../hooks/useAuth";

type AuthGuardProps = PropsWithChildren<{
  loadingFallback?: ReactNode;
}>;

export default function AuthGuard({
  children,
  loadingFallback = null,
}: AuthGuardProps) {
  const { isAuthenticated, status, user } = useAuth();
  const location = useLocation();

  if (status === "loading") return loadingFallback;

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to={PATH_AUTH.login} />;
  }

  if (user?.isPending && location.pathname !== PATH_PAGE.pending) {
    return <Navigate replace to={PATH_PAGE.pending} />;
  }

  if (!user?.isPending && location.pathname === PATH_PAGE.pending) {
    return <Navigate replace to="/dashboard/home" />;
  }

  return children;
}
