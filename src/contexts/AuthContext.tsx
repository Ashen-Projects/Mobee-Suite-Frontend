import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { BASE_URL } from "../config";
import { get, post } from "../inteceptor";
import { accessVerify } from "../utils/common";
import { USER_ROLES } from "../utils/constants";

export type AuthStatus = "authenticated" | "loading" | "unauthenticated";

export type AuthRole = {
  id: number;
  label: string;
  name: string;
};

export type AuthUser = {
  defaultLocationId: number | null;
  displayName: string;
  email: string | null;
  id: number;
  isPending: boolean;
  permissions: string[];
  roles: AuthRole[];
  username: string;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

type AuthContextValue = {
  can: (permission: string) => boolean;
  canAny: (permissions: string[]) => boolean;
  hasRole: (role: string) => boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  status: AuthStatus;
  user: AuthUser | null;
};

type LoginResponse = {
  user: AuthUser;
};

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);

  const refreshSession = useCallback(async () => {
    setStatus("loading");

    try {
      const response = await get<AuthUser>("auth/me", {}, BASE_URL);
      setUser(response.data);
      setStatus("authenticated");
    } catch {
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setStatus("unauthenticated");
    };

    window.addEventListener("mobee:unauthorized", handleUnauthorized);
    return () =>
      window.removeEventListener("mobee:unauthorized", handleUnauthorized);
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await post<LoginResponse, LoginCredentials>(
      "auth/login",
      credentials,
      BASE_URL,
      false,
    );
    const authenticatedUser = response.data.user;

    setUser(authenticatedUser);
    setStatus("authenticated");
    return authenticatedUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await post<void, Record<string, never>>(
        "auth/logout",
        {},
        BASE_URL,
        false,
      );
    } finally {
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const permissionSet = new Set(user?.permissions ?? []);
    const roleSet = new Set(user?.roles.map((role) => role.name) ?? []);
    const permissionList = [...permissionSet];
    const isAdministrator = roleSet.has(USER_ROLES.ADMIN);

    return {
      can: (permission) =>
        isAdministrator || accessVerify(permission, permissionList),
      canAny: (permissions) =>
        isAdministrator ||
        permissions.some((permission) =>
          accessVerify(permission, permissionList),
        ),
      hasRole: (role) => roleSet.has(role),
      isAuthenticated: status === "authenticated",
      login,
      logout,
      refreshSession,
      status,
      user,
    };
  }, [login, logout, refreshSession, status, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
