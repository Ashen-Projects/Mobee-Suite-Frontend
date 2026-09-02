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
      fontSize: 13,
      body1: { fontSize: "0.875rem", lineHeight: 1.45 },
      body2: { fontSize: "0.8125rem", lineHeight: 1.45 },
      caption: { fontSize: "0.72rem", lineHeight: 1.35 },
      h4: { fontSize: "1.25rem", fontWeight: 700, lineHeight: 1.4 },
      h5: { fontSize: "1.05rem", fontWeight: 700, lineHeight: 1.4 },
      h6: { fontSize: "0.95rem", fontWeight: 600, lineHeight: 1.45 },
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
          ".MuiDataGrid-root": { minHeight: "620px" },
          ".MuiDataGrid-root:focus, .MuiDataGrid-root:focus-within": {
            boxShadow: "none !important",
            outline: "none !important",
          },
          ".MuiDataGrid-root .MuiDataGrid-columnHeaders": {
            backgroundColor: mode === "light" ? "rgba(145, 158, 171, 0.08)" : "rgba(255, 255, 255, 0.05)",
            maxHeight: "48px !important",
            minHeight: "48px !important",
          },
          ".MuiDataGrid-root .MuiDataGrid-columnHeaderTitle": { fontSize: 12, fontWeight: 700 },
          ".MuiDataGrid-root .MuiDataGrid-cell": {
            alignItems: "center !important",
            display: "flex !important",
            fontSize: 12.5,
            lineHeight: 1.35,
            whiteSpace: "nowrap",
          },
          ".MuiDataGrid-root .MuiDataGrid-columnSeparator": {
            display: "none",
          },
          ".MuiDataGrid-root .MuiDataGrid-row": {
            maxHeight: "52px !important",
            minHeight: "52px !important",
          },
          ".MuiDataGrid-root .MuiDataGrid-row:hover": {
            backgroundColor: mode === "light" ? "rgba(145, 158, 171, 0.08)" : "rgba(255, 255, 255, 0.05)",
          },
          ".MuiDataGrid-root .MuiDataGrid-row.Mui-selected, .MuiDataGrid-root .MuiDataGrid-row.Mui-selected:hover": {
            backgroundColor: "transparent",
          },
          ".MuiDataGrid-root .MuiDataGrid-cell:focus, .MuiDataGrid-root .MuiDataGrid-cell:focus-within, .MuiDataGrid-root .MuiDataGrid-columnHeader:focus, .MuiDataGrid-root .MuiDataGrid-columnHeader:focus-within, .MuiDataGrid-root .MuiDataGrid-cell.MuiDataGrid-cell--editing": {
            boxShadow: "none !important",
            outline: "none !important",
          },
          ".MuiDataGrid-root .MuiDataGrid-footerContainer": { minHeight: 52 },
          ".MuiDataGrid-virtualScroller": { minHeight: "470px" },
        },
      },
      MuiDrawer: {
        styleOverrides: { paper: { backgroundImage: "none" } },
      },
      MuiTextField: {
        defaultProps: { size: "small", type: "text" },
        styleOverrides: {
          root: {
            "& input": { fontSize: "0.875rem" },
            "& textarea": { fontSize: "0.875rem" },
          },
        },
      },
      MuiFormControl: {
        defaultProps: { size: "small" },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontSize: "0.75rem", fontWeight: 500 },
          sizeSmall: { height: 24 },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          sizeSmall: { padding: 6 },
        },
      },
    },
  });
