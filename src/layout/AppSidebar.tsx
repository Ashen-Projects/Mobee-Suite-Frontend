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
import { useEffect, useState } from "react";
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
  const { isExpanded, isMobileOpen, toggleMobileSidebar } = useSidebar();
  const { canAny } = useAuth();
  const { pathname } = useLocation();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const visibleNavItems = navItems.map((item) => item.subItems ? { ...item, subItems: item.subItems.filter((child) => {
    const permissions = getRoutePermissions(child.path);
    return permissions.includes(USER_ACCESS.PUBLIC) || canAny([...permissions]);
  }) } : item).filter((item) => item.path || item.subItems?.length);
  useEffect(() => {
    const activeParent = visibleNavItems.find((item) => item.subItems?.some((child) => child.path === pathname));
    if (activeParent) setOpenMenu(activeParent.name);
  }, [pathname, visibleNavItems]);

  const navigateOnMobile = () => {
    if (!isDesktop && isMobileOpen) toggleMobileSidebar();
  };

  const content = (
    <>
      <Toolbar sx={{ minHeight: { xs: 68, sm: 74 }, px: 1.5 }}>
        <Stack alignItems="center" direction="row" justifyContent="space-between" sx={{ width: "100%" }}>
        <Box component={Link} onClick={navigateOnMobile} sx={{ alignItems: "center", display: "flex", minWidth: 0, textDecoration: "none" }} to={PATH_DASHBOARD.dashboard.root}>
          <BrandLogo compact={!isExpanded && isDesktop} />
        </Box>
        {!isDesktop ? <IconButton aria-label="Close navigation" onClick={toggleMobileSidebar} size="small" sx={{ bgcolor: "action.hover", flexShrink: 0 }}>
          <CloseRoundedIcon fontSize="small" />
        </IconButton> : null}
        </Stack>
      </Toolbar>
      <Divider />
      <List sx={{ flex: 1, overflowX: "hidden", overflowY: "auto", px: { xs: 1.25, sm: 1.5 }, py: 1.5 }}>
        {visibleNavItems.map((item) => {
          const isSelected = item.path === pathname || item.subItems?.some((child) => child.path === pathname);
          const itemButton = (
            <ListItemButton
              component={item.path ? Link : "button"}
              onClick={() => {
                if (item.subItems) setOpenMenu((current) => current === item.name ? null : item.name);
                else navigateOnMobile();
              }}
              selected={Boolean(isSelected)}
              sx={{
                borderRadius: 2.25,
                justifyContent: isExpanded || !isDesktop ? "initial" : "center",
                mb: 0.5,
                minHeight: 46,
                px: 1.5,
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
              <ListItemIcon sx={{ color: "inherit", minWidth: isExpanded || !isDesktop ? 38 : 0, "& svg": { height: 21, width: 21 } }}>
                {item.icon}
              </ListItemIcon>
              {(isExpanded || !isDesktop) && <ListItemText primary={item.name} primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />}
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
                        onClick={navigateOnMobile}
                        selected={pathname === child.path}
                        sx={{
                          borderRadius: 2,
                          mb: 0.25,
                          minHeight: 38,
                          pl: 5.75,
                          pr: 1.5,
                          "&.Mui-selected": {
                            bgcolor: "action.selected",
                            color: "primary.main",
                          },
                        }}
                        to={child.path}
                      >
                        <ListItemText primary={child.name} primaryTypographyProps={{ fontSize: 13 }} />
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
      onClose={toggleMobileSidebar}
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
          maxWidth: 340,
          overflowX: "hidden",
          width: { xs: "min(84vw, 320px)", sm: 300 },
        },
      }}
    >
      {content}
    </Drawer>
  );
}
