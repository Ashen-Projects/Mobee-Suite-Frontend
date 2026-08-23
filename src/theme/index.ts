import { createTheme, type PaletteMode } from "@mui/material/styles";

export const createMobeeTheme = (mode: PaletteMode) =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: "#ffae00",
        light: "#ffd335",
        dark: "#d99100",
        contrastText: "#333333",
      },
      secondary: { main: "#333333" },
      background: {
        default: mode === "light" ? "#f7f8fa" : "#171717",
        paper: mode === "light" ? "#ffffff" : "#242424",
      },
    },
    shape: { borderRadius: 8 },
    typography: {
      fontFamily: 'Poppins, "Helvetica Neue", Arial, sans-serif',
      h4: { fontSize: "1.5rem", fontWeight: 700, lineHeight: 1.5 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 600 },
      button: { fontWeight: 600, textTransform: "none" },
    },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: { root: { borderRadius: 8 } },
      },
      MuiCard: {
        styleOverrides: { root: { backgroundImage: "none", borderRadius: 16, boxShadow: mode === "light" ? "0 0 2px rgba(145, 158, 171, 0.2), 0 12px 24px -4px rgba(145, 158, 171, 0.12)" : "0 0 2px rgba(0, 0, 0, 0.24), 0 12px 24px -4px rgba(0, 0, 0, 0.24)" } },
      },
      MuiCssBaseline: {
        styleOverrides: {
          body: { minWidth: 320 },
          "*": { boxSizing: "border-box" },
        },
      },
      MuiDrawer: {
        styleOverrides: { paper: { backgroundImage: "none" } },
      },
      MuiTextField: {
        defaultProps: { size: "small" },
      },
      MuiFormControl: {
        defaultProps: { size: "small" },
      },
    },
  });
