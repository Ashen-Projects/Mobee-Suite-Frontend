import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import PointOfSaleRoundedIcon from "@mui/icons-material/PointOfSaleRounded";
import { AppBar, Avatar, Box, Button, Divider, IconButton, ListItemIcon, Menu, MenuItem, Stack, Toolbar, Tooltip, useMediaQuery, useTheme as useMuiTheme } from "@mui/material";
import { MouseEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import BrandLogo from "../components/common/BrandLogo";
import LogoutConfirmationDialog from "../components/common/LogoutConfirmationDialog";
import NotificationBell from "../components/notifications/NotificationBell";
import { useTheme } from "../context/ThemeContext";
import { useSidebar } from "../context/SidebarContext";
import useAuth from "../hooks/useAuth";
import { PATH_AUTH, PATH_DASHBOARD, getRoutePermissions } from "../routes/paths";
import { USER_ACCESS, USER_ROLES } from "../utils";
import { navItems, type NavItem } from "./navConfig";

type NavMenuState = { anchor: HTMLElement; item: NavItem } | null;

export default function AppHeader() {
  const muiTheme = useMuiTheme();
  const isPhone = useMediaQuery(muiTheme.breakpoints.down("sm"));
  const showHorizontalNav = useMediaQuery(muiTheme.breakpoints.up("xl"));
  const { openMobileSidebar } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const { canAny, hasRole, logout, user } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [accountAnchor, setAccountAnchor] = useState<HTMLElement | null>(null);
  const [navMenu, setNavMenu] = useState<NavMenuState>(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const canOpenPos = canAny([...getRoutePermissions(PATH_DASHBOARD.pos.root)])
    && (hasRole(USER_ROLES.ADMIN) || ["sales", "sale", "cashier", "sales_person"].some((role) => hasRole(role)));
  const posActive = pathname === PATH_DASHBOARD.pos.root || pathname.startsWith(`${PATH_DASHBOARD.pos.root}/`);
  const visibleNavItems = navItems.map((item) => item.subItems ? { ...item, subItems: item.subItems.filter((child) => {
    const permissions = getRoutePermissions(child.path);
    return permissions.includes(USER_ACCESS.PUBLIC) || canAny([...permissions]);
  }) } : item).filter((item) => item.path || item.subItems?.length);

  const openNavMenu = (event: MouseEvent<HTMLElement>, item: NavItem) => setNavMenu({ anchor: event.currentTarget, item });
  const closeNavMenu = () => setNavMenu(null);
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setLogoutDialogOpen(false);
      navigate(PATH_AUTH.login, { replace: true });
    } finally { setIsLoggingOut(false); }
  };

  return <AppBar color="transparent" elevation={0} position="fixed" sx={{ bgcolor: "transparent", pointerEvents: "none", px: { xs: 0, sm: 1.25, md: 2 }, pt: { xs: 0, sm: 1.25, md: 1.5 }, width: "100%", zIndex: (value) => value.zIndex.drawer + 1 }}>
    <Toolbar sx={{ backdropFilter: "blur(18px)", bgcolor: (value) => value.palette.mode === "dark" ? "rgba(17,17,17,0.96)" : "rgba(255,255,255,0.96)", border: 1, borderColor: (value) => value.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(51,51,51,0.08)", borderRadius: { xs: 0, sm: 999 }, boxShadow: (value) => value.palette.mode === "dark" ? { xs: "0 1px 0 rgba(255,255,255,0.06)", sm: "0 14px 36px rgba(0,0,0,0.32)" } : { xs: "0 1px 0 rgba(51,51,51,0.08)", sm: "0 14px 36px rgba(51,51,51,0.14)" }, gap: { xs: 0.5, sm: 1, xl: 2.5 }, maxWidth: 1600, minHeight: { xs: 56, sm: 62, md: 68 }, mx: "auto", pointerEvents: "auto", px: { xs: 1, sm: 1.25, md: 1.75 }, width: "100%" }}>
      {!showHorizontalNav ? <IconButton aria-label="Open navigation" edge="start" onClick={openMobileSidebar} size="small" sx={{ height: { xs: 34, sm: 36 }, width: { xs: 34, sm: 36 } }}><MenuRoundedIcon fontSize="small" /></IconButton> : null}
      <Box component={Link} sx={{ alignItems: "center", display: "flex", flexShrink: 0, minWidth: 0, textDecoration: "none" }} to={PATH_DASHBOARD.dashboard.root}><BrandLogo sx={{ maxHeight: { xs: 31, sm: 40, md: 44 }, width: { xs: 104, sm: 138, md: 154 } }} /></Box>
      {canOpenPos ? <Button
        component={Link}
        startIcon={<PointOfSaleRoundedIcon />}
        sx={{
          bgcolor: posActive ? "primary.dark" : "primary.main",
          borderRadius: { xs: 2, sm: 999 },
          boxShadow: { xs: "none", sm: "0 10px 22px rgba(255, 174, 0, 0.28)" },
          color: "primary.contrastText",
          flexShrink: 0,
          fontSize: { xs: 11, sm: 13 },
          fontWeight: 900,
          height: { xs: 32, sm: 42, md: 44 },
          minWidth: { xs: 54, sm: 82, md: 88 },
          px: { xs: 0.85, sm: 1.6 },
          textTransform: "uppercase",
          "& .MuiButton-startIcon": { m: { xs: "0 4px 0 0", sm: "0 6px 0 0" }, "& .MuiSvgIcon-root": { fontSize: { xs: 16, sm: 20 } } },
          "&:hover": { bgcolor: "primary.dark", boxShadow: "0 12px 28px rgba(255, 174, 0, 0.34)" },
        }}
        to={PATH_DASHBOARD.pos.root}
      >
        POS
      </Button> : null}

      {showHorizontalNav ? <Stack alignItems="center" bgcolor="action.hover" borderRadius={999} component="nav" direction="row" justifyContent="center" spacing={0.1} sx={{ flex: "0 1 auto", mx: "auto", p: 0.35 }}>
        {visibleNavItems.map((item) => {
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

      <Stack alignItems="center" bgcolor={{ xs: "transparent", sm: "action.hover" }} borderRadius={999} direction="row" spacing={{ xs: 0.125, sm: 0.25 }} sx={{ flexShrink: 0, p: { xs: 0, sm: 0.5 } }}>
        <Tooltip title={theme === "dark" ? "Use light theme" : "Use dark theme"}><IconButton aria-label="Toggle color theme" onClick={toggleTheme} size="small" sx={{ display: { xs: "none", sm: "inline-flex" }, height: 36, width: 36 }}>{theme === "dark" ? <LightModeOutlinedIcon fontSize="small" /> : <DarkModeOutlinedIcon fontSize="small" />}</IconButton></Tooltip>
        <NotificationBell />
        <Tooltip title="Account"><IconButton aria-label="Open user menu" onClick={(event) => setAccountAnchor(event.currentTarget)} size="small" sx={{ p: 0.25 }}><Avatar sx={{ bgcolor: "primary.main", color: "primary.contrastText", fontSize: { xs: 12, sm: 14 }, height: { xs: 30, sm: 32 }, width: { xs: 30, sm: 32 } }}>{(user?.displayName || user?.username || "U").charAt(0).toUpperCase()}</Avatar></IconButton></Tooltip>
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
      {isPhone ? <MenuItem onClick={() => { toggleTheme(); setAccountAnchor(null); }}><ListItemIcon>{theme === "dark" ? <LightModeOutlinedIcon fontSize="small" /> : <DarkModeOutlinedIcon fontSize="small" />}</ListItemIcon>{theme === "dark" ? "Use light theme" : "Use dark theme"}</MenuItem> : null}
      <Divider />
      <MenuItem onClick={() => { setAccountAnchor(null); setLogoutDialogOpen(true); }}><ListItemIcon><LogoutOutlinedIcon fontSize="small" /></ListItemIcon>Logout</MenuItem>
    </Menu>
    <LogoutConfirmationDialog isLoggingOut={isLoggingOut} onCancel={() => setLogoutDialogOpen(false)} onConfirm={() => void handleLogout()} open={logoutDialogOpen} />
  </AppBar>;
}
