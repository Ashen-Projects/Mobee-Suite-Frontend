import type { PropsWithChildren } from "react";
import useAuth from "../hooks/useAuth";
import PermissionRequired from "../pages/errorPages/PermissionRequired";

type PermissionGuardProps = PropsWithChildren<{
  permissions: readonly string[];
}>;

export default function PermissionGuard({
  children,
  permissions,
}: PermissionGuardProps) {
  const { canAny } = useAuth();
  if (permissions.length > 0 && !canAny([...permissions])) {
    return <PermissionRequired />;
  }

  return children;
}
