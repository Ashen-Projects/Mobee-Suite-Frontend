import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import { AppBar, Avatar, Badge, Box, Button, Divider, IconButton, ListItemIcon, Menu, MenuItem, Stack, Toolbar, Tooltip, useMediaQuery, useTheme as useMuiTheme } from "@mui/material";
import { MouseEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import BrandLogo from "../components/common/BrandLogo";
import { useTheme } from "../context/ThemeContext";
import { useSidebar } from "../context/SidebarContext";
import useAuth from "../hooks/useAuth";
import { PATH_AUTH, PATH_DASHBOARD } from "../routes/paths";
import { navItems, type NavItem } from "./navConfig";

type NavMenuState = { anchor: HTMLElement; item: NavItem } | null;

export default function AppHeader() {
  const muiTheme = useMuiTheme();
  const showHorizontalNav = useMediaQuery(muiTheme.breakpoints.up("xl"));
  const { toggleMobileSidebar } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const { logout, user } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [accountAnchor, setAccountAnchor] = useState<HTMLElement | null>(null);
  const [navMenu, setNavMenu] = useState<NavMenuState>(null);

  const openNavMenu = (event: MouseEvent<HTMLElement>, item: NavItem) => setNavMenu({ anchor: event.currentTarget, item });
  const closeNavMenu = () => setNavMenu(null);
  const handleLogout = async () => {
    setAccountAnchor(null);
    await logout();
    navigate(PATH_AUTH.login, { replace: true });
  };

  return <AppBar color="transparent" elevation={0} position="fixed" sx={{ bgcolor: "transparent", pointerEvents: "none", px: { xs: 1, sm: 2 }, pt: { xs: 1, sm: 1.5 }, width: "100%", zIndex: (value) => value.zIndex.drawer + 1 }}>
    <Toolbar sx={{ backdropFilter: "blur(18px)", bgcolor: (value) => value.palette.mode === "dark" ? "rgba(17,17,17,0.94)" : "rgba(255,255,255,0.94)", border: 1, borderColor: (value) => value.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(51,51,51,0.08)", borderRadius: 999, boxShadow: (value) => value.palette.mode === "dark" ? "0 14px 36px rgba(0,0,0,0.32)" : "0 14px 36px rgba(51,51,51,0.14)", gap: { xs: 1, xl: 2.5 }, maxWidth: 1600, minHeight: { xs: 60, sm: 68 }, mx: "auto", pointerEvents: "auto", px: { xs: 1.25, sm: 1.75 }, width: "100%" }}>
      {!showHorizontalNav ? <IconButton aria-label="Open navigation" edge="start" onClick={toggleMobileSidebar}><MenuRoundedIcon /></IconButton> : null}
      <Box component={Link} sx={{ alignItems: "center", display: "flex", flexShrink: 0, textDecoration: "none" }} to={PATH_DASHBOARD.dashboard.root}><BrandLogo sx={{ maxHeight: { xs: 38, sm: 44 }, width: { xs: 132, sm: 154 } }} /></Box>

      {showHorizontalNav ? <Stack alignItems="center" bgcolor="action.hover" borderRadius={999} component="nav" direction="row" justifyContent="center" spacing={0.1} sx={{ flex: "0 1 auto", mx: "auto", p: 0.35 }}>
        {navItems.map((item) => {
          const active = item.path === pathname || item.subItems?.some((child) => child.path === pathname);
          return <Button
            color={active ? "primary" : "inherit"}
            component={item.path ? Link : "button"}
            endIcon={item.subItems ? <KeyboardArrowDownRoundedIcon /> : undefined}
            key={item.name}
            onClick={item.subItems ? (event: MouseEvent<HTMLElement>) => openNavMenu(event, item) : undefined}
            size="small"
            sx={{ bgcolor: active ? "background.paper" : "transparent", borderRadius: 999, boxShadow: active ? "0 2px 8px rgba(0,0,0,0.08)" : "none", color: active ? "text.primary" : "text.secondary", flexShrink: 1, fontSize: 12, minWidth: 0, px: 1, py: 0.75, whiteSpace: "nowrap", "& .MuiButton-endIcon": { ml: 0.2 }, "& .MuiSvgIcon-root": { fontSize: 16 }, "&:hover": { bgcolor: "background.paper", color: "text.primary" } }}
            to={item.path}
          >{item.name}</Button>;
        })}
      </Stack> : <Box sx={{ flex: 1 }} />}

      <Stack alignItems="center" bgcolor="action.hover" borderRadius={999} direction="row" spacing={0.25} sx={{ flexShrink: 0, p: 0.5 }}>
        <Tooltip title={theme === "dark" ? "Use light theme" : "Use dark theme"}><IconButton aria-label="Toggle color theme" onClick={toggleTheme} size="small" sx={{ height: 36, width: 36 }}>{theme === "dark" ? <LightModeOutlinedIcon fontSize="small" /> : <DarkModeOutlinedIcon fontSize="small" />}</IconButton></Tooltip>
        <Tooltip title="Notifications"><IconButton aria-label="Notifications" size="small" sx={{ height: 36, width: 36 }}><Badge color="error" variant="dot"><NotificationsNoneOutlinedIcon fontSize="small" /></Badge></IconButton></Tooltip>
        <Tooltip title="Account"><IconButton aria-label="Open user menu" onClick={(event) => setAccountAnchor(event.currentTarget)} size="small" sx={{ p: 0.25 }}><Avatar sx={{ bgcolor: "primary.main", color: "primary.contrastText", fontSize: 14, height: 32, width: 32 }}>{(user?.displayName || user?.username || "U").charAt(0).toUpperCase()}</Avatar></IconButton></Tooltip>
      </Stack>
    </Toolbar>

    <Menu
      anchorEl={navMenu?.anchor}
      anchorOrigin={{ horizontal: "center", vertical: "bottom" }}
      onClose={closeNavMenu}
      open={Boolean(navMenu)}
      slotProps={{ paper: { sx: { backdropFilter: "blur(18px)", bgcolor: (value) => value.palette.mode === "dark" ? "rgba(31,31,31,0.96)" : "rgba(255,255,255,0.97)", border: 1, borderColor: "divider", borderRadius: 3, boxShadow: "0 16px 40px rgba(0,0,0,0.2)", minWidth: 220, mt: 1.25, p: 0.75 } } }}
      transformOrigin={{ horizontal: "center", vertical: "top" }}
    >
      {navMenu?.item.subItems?.map((child) => <MenuItem component={Link} key={child.path} onClick={closeNavMenu} selected={pathname === child.path} sx={{ borderRadius: 2, fontSize: 13, fontWeight: pathname === child.path ? 600 : 400, minHeight: 40, px: 1.5, "&.Mui-selected": { bgcolor: "primary.main", color: "primary.contrastText" }, "&.Mui-selected:hover": { bgcolor: "primary.dark" }, "&:not(:last-of-type)": { mb: 0.25 } }} to={child.path}>{child.name}</MenuItem>)}
    </Menu>
    <Menu anchorEl={accountAnchor} onClose={() => setAccountAnchor(null)} open={Boolean(accountAnchor)} slotProps={{ paper: { sx: { minWidth: 190, mt: 1 } } }}>
      <MenuItem component={Link} onClick={() => setAccountAnchor(null)} to={PATH_DASHBOARD.settings.profile}><ListItemIcon><PersonOutlineIcon fontSize="small" /></ListItemIcon>My Profile</MenuItem>
      <Divider />
      <MenuItem onClick={() => void handleLogout()}><ListItemIcon><LogoutOutlinedIcon fontSize="small" /></ListItemIcon>Logout</MenuItem>
    </Menu>
  </AppBar>;
}
