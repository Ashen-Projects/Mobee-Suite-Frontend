import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  Box,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Tooltip,
  useMediaQuery,
  useTheme as useMuiTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router";
import BrandLogo from "../components/common/BrandLogo";
import { useSidebar } from "../context/SidebarContext";
import useAuth from "../hooks/useAuth";
import { PATH_DASHBOARD, getRoutePermissions } from "../routes/paths";
import { USER_ACCESS } from "../utils";
import { navItems } from "./navConfig";

export const DRAWER_WIDTH = 252;
export const COLLAPSED_DRAWER_WIDTH = 72;

export default function AppSidebar() {
  const muiTheme = useMuiTheme();
  const isDesktop = useMediaQuery(muiTheme.breakpoints.up("xl"));
  const { closeMobileSidebar, isExpanded, isMobileOpen } = useSidebar();
  const { canAny } = useAuth();
  const { pathname } = useLocation();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const visibleNavItems = useMemo(() => navItems.map((item) => item.subItems ? { ...item, subItems: item.subItems.filter((child) => {
    const permissions = getRoutePermissions(child.path);
    return permissions.includes(USER_ACCESS.PUBLIC) || canAny([...permissions]);
  }) } : item).filter((item) => item.path || item.subItems?.length), [canAny]);
  useEffect(() => {
    const activeParent = visibleNavItems.find((item) => item.subItems?.some((child) => child.path === pathname));
    if (activeParent) setOpenMenu(activeParent.name);
  }, [pathname, visibleNavItems]);

  const closeOnMobile = () => {
    if (!isDesktop) closeMobileSidebar();
  };

  const content = (
    <>
      <Toolbar sx={{ minHeight: { xs: 58, sm: 66 }, px: { xs: 1, sm: 1.25 } }}>
        <Stack alignItems="center" direction="row" justifyContent="space-between" sx={{ width: "100%" }}>
        <Box component={Link} onClick={closeOnMobile} sx={{ alignItems: "center", display: "flex", minWidth: 0, textDecoration: "none" }} to={PATH_DASHBOARD.dashboard.root}>
          <BrandLogo compact={!isExpanded && isDesktop} sx={{ maxHeight: { xs: 36, sm: 42 }, width: { xs: 136, sm: 164 } }} />
        </Box>
        {!isDesktop ? <IconButton aria-label="Close navigation" onClick={closeMobileSidebar} size="small" sx={{ bgcolor: "action.hover", flexShrink: 0, height: 30, width: 30 }}>
          <CloseRoundedIcon fontSize="small" />
        </IconButton> : null}
        </Stack>
      </Toolbar>
      <Divider />
      <List sx={{ flex: 1, overflowX: "hidden", overflowY: "auto", px: { xs: 0.75, sm: 1.25 }, py: { xs: 0.75, sm: 1.25 } }}>
        {visibleNavItems.map((item) => {
          const isSelected = item.path === pathname || item.subItems?.some((child) => child.path === pathname);
          const itemButton = (
            <ListItemButton
              component={item.path ? Link : "button"}
              onClick={() => {
                if (item.subItems) setOpenMenu((current) => current === item.name ? null : item.name);
                else closeOnMobile();
              }}
              selected={Boolean(isSelected)}
              sx={{
                borderRadius: 2,
                justifyContent: isExpanded || !isDesktop ? "initial" : "center",
                mb: { xs: 0.25, sm: 0.5 },
                minHeight: { xs: 40, sm: 44 },
                px: { xs: 1, sm: 1.25 },
                "&.Mui-selected": {
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  boxShadow: "0 10px 24px rgba(255, 174, 0, 0.22)",
                },
                "&.Mui-selected:hover": {
                  bgcolor: "primary.dark",
                },
              }}
              to={item.path}
            >
              <ListItemIcon sx={{ color: "inherit", minWidth: isExpanded || !isDesktop ? { xs: 32, sm: 36 } : 0, "& svg": { height: { xs: 18, sm: 20 }, width: { xs: 18, sm: 20 } } }}>
                {item.icon}
              </ListItemIcon>
              {(isExpanded || !isDesktop) && <ListItemText primary={item.name} primaryTypographyProps={{ fontSize: { xs: 12.5, sm: 13.5 }, fontWeight: 600, noWrap: true }} />}
              {item.subItems && (isExpanded || !isDesktop) && (openMenu === item.name ? <ExpandLessIcon /> : <ExpandMoreIcon />)}
            </ListItemButton>
          );

          return (
            <Box key={item.name}>
              {!isExpanded && isDesktop ? <Tooltip placement="right" title={item.name}>{itemButton}</Tooltip> : itemButton}
              {item.subItems && (isExpanded || !isDesktop) && (
                <Collapse in={openMenu === item.name} timeout="auto" unmountOnExit>
                  <List disablePadding>
                    {item.subItems.map((child) => (
                      <ListItemButton
                        component={Link}
                        key={child.path}
                        onClick={closeOnMobile}
                        selected={pathname === child.path}
                        sx={{
                          borderRadius: 1.75,
                          mb: 0.25,
                          minHeight: { xs: 34, sm: 37 },
                          pl: { xs: 4.25, sm: 5.25 },
                          pr: 1,
                          "&.Mui-selected": {
                            bgcolor: "action.selected",
                            color: "primary.main",
                          },
                        }}
                        to={child.path}
                      >
                        <ListItemText primary={child.name} primaryTypographyProps={{ fontSize: { xs: 11.5, sm: 12.5 }, fontWeight: 500, noWrap: true }} />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              )}
            </Box>
          );
        })}
      </List>
    </>
  );

  return (
    <Drawer
      ModalProps={{ keepMounted: true }}
      onClose={closeMobileSidebar}
      open={!isDesktop && isMobileOpen}
      variant="temporary"
      sx={{
        zIndex: (theme) => theme.zIndex.modal + 2,
        display: { xl: "none" },
        "& .MuiBackdrop-root": {
          backdropFilter: "blur(4px)",
          bgcolor: (theme) => alpha(theme.palette.common.black, theme.palette.mode === "dark" ? 0.62 : 0.42),
        },
        "& .MuiDrawer-paper": {
          bgcolor: "background.paper",
          backgroundImage: "none",
          borderRight: 1,
          borderColor: "divider",
          boxShadow: "24px 0 60px rgba(0,0,0,0.28)",
          boxSizing: "border-box",
          display: "flex",
          height: "100dvh",
          maxWidth: 264,
          overflowX: "hidden",
          width: { xs: "min(72vw, 250px)", sm: 264 },
        },
      }}
    >
      {content}
    </Drawer>
  );
}
