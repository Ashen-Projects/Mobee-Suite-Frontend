import { Box, Toolbar } from "@mui/material";
import { Outlet } from "react-router";
import { SidebarProvider } from "../context/SidebarContext";
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";

const LayoutContent = () => {
  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      <AppHeader />
      <AppSidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          px: { xs: 2, sm: 3, lg: 2 },
          py: { xs: 2.5, sm: 3 },
          transition: (theme) => theme.transitions.create("margin-left"),
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 72, sm: 84 } }} />
        <Box sx={{ maxWidth: 1536, mx: "auto", width: "100%" }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default function AppLayout() {
  return <SidebarProvider><LayoutContent /></SidebarProvider>;
}
