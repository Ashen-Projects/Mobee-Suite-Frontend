import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import { Box, IconButton, Stack, Tooltip } from "@mui/material";
import type { ReactNode } from "react";
import BrandLogo from "../../components/common/BrandLogo";
import { useTheme } from "../../context/ThemeContext";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <Box sx={{ alignItems: "center", display: "flex", justifyContent: "center", minHeight: "100dvh", p: 2, position: "relative" }}>
      <Stack alignItems="center" spacing={3} sx={{ maxWidth: 440, width: "100%" }}>
        <BrandLogo />
        {children}
      </Stack>
      <Tooltip title="Toggle theme"><IconButton onClick={toggleTheme} sx={{ bottom: 24, position: "fixed", right: 24 }}>{theme === "dark" ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}</IconButton></Tooltip>
    </Box>
  );
}
