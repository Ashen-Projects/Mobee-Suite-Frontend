import { CssBaseline, ThemeProvider as MuiThemeProvider } from "@mui/material";
import type { PaletteMode } from "@mui/material";
import type React from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createMobeeTheme } from "../theme";

type ThemeContextType = {
  theme: PaletteMode;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<PaletteMode>(() => {
    const savedTheme = window.localStorage.getItem("theme");
    return savedTheme === "dark" ? "dark" : "light";
  });
  const muiTheme = useMemo(() => createMobeeTheme(theme), [theme]);

  useEffect(() => {
    window.localStorage.setItem("theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () => setTheme((current) => (current === "light" ? "dark" : "light")),
    }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
