import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Box,
  Collapse,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  useMediaQuery,
  useTheme as useMuiTheme,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import BrandLogo from "../components/common/BrandLogo";
import { useSidebar } from "../context/SidebarContext";
import { PATH_DASHBOARD } from "../routes/paths";
import { navItems } from "./navConfig";

export const DRAWER_WIDTH = 252;
export const COLLAPSED_DRAWER_WIDTH = 72;

export default function AppSidebar() {
  const muiTheme = useMuiTheme();
  const isDesktop = useMediaQuery(muiTheme.breakpoints.up("xl"));
  const { isExpanded, isMobileOpen, toggleMobileSidebar } = useSidebar();
  const { pathname } = useLocation();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  useEffect(() => {
    const activeParent = navItems.find((item) => item.subItems?.some((child) => child.path === pathname));
    if (activeParent) setOpenMenu(activeParent.name);
  }, [pathname]);

  const navigateOnMobile = () => {
    if (!isDesktop && isMobileOpen) toggleMobileSidebar();
  };

  const content = (
    <>
      <Toolbar sx={{ minHeight: { xs: 64, sm: 68 }, justifyContent: "center", px: 1.5 }}>
        <Box component={Link} sx={{ display: "block", textDecoration: "none" }} to={PATH_DASHBOARD.dashboard.root}>
          <BrandLogo compact={!isExpanded && isDesktop} />
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{ overflowX: "hidden", overflowY: "auto", px: 1.25, py: 1.5 }}>
        {navItems.map((item) => {
          const isSelected = item.path === pathname || item.subItems?.some((child) => child.path === pathname);
          const itemButton = (
            <ListItemButton
              component={item.path ? Link : "button"}
              onClick={() => {
                if (item.subItems) setOpenMenu((current) => current === item.name ? null : item.name);
                else navigateOnMobile();
              }}
              selected={Boolean(isSelected)}
              sx={{ borderRadius: 2, justifyContent: isExpanded || !isDesktop ? "initial" : "center", mb: 0.5, minHeight: 44, px: 1.5 }}
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
                        sx={{ borderRadius: 2, mb: 0.25, minHeight: 38, pl: 5.75, pr: 1.5 }}
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
        display: { xl: "none" },
        "& .MuiDrawer-paper": { boxSizing: "border-box", overflowX: "hidden", width: Math.min(DRAWER_WIDTH, 300) },
      }}
    >
      {content}
    </Drawer>
  );
}
