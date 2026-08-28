import { Box, Container, Typography } from "@mui/material";
import accessDeniedIllustration from "../../assets/undraw_access-denied_krem.svg";
import PageMeta from "../../components/common/PageMeta";
import useAuth from "../../hooks/useAuth";
import { USER_ROLES } from "../../utils/constants";

export default function PermissionRequired() {
  const { hasRole } = useAuth();
  const isPendingUser = hasRole(USER_ROLES.PENDING);
  const title = isPendingUser ? "Access Pending" : "Permission Required";
  return (
    <>
      <PageMeta description="Permission is required to access this page." title={`${title} | Mobee Suite`} />
      <Container maxWidth="sm" sx={{ alignItems: "center", display: "flex", minHeight: "calc(100vh - 150px)", py: 5 }}>
        <Box sx={{ textAlign: "center", width: "100%" }}>
          <Box
            alt="Access denied"
            component="img"
            src={accessDeniedIllustration}
            sx={{
              display: "block",
              height: "auto",
              maxHeight: { xs: 220, sm: 300 },
              maxWidth: "100%",
              mx: "auto",
              objectFit: "contain",
              width: { xs: 260, sm: 380 },
            }}
          />
          <Typography sx={{ mt: 4 }} variant="h3">{title}</Typography>
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            {isPendingUser
              ? "Your account is ready, but an administrator has not assigned your working role yet."
              : "Oops. Looks like you don't have permission to access this page."}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {isPendingUser ? "Please contact your administrator to request access." : "Please contact an administrator if you need access."}
          </Typography>
        </Box>
      </Container>
    </>
  );
}
