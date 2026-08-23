import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { Box, Container, Paper, Typography } from "@mui/material";
import PageMeta from "../../components/common/PageMeta";

export default function PermissionRequired() {
  return (
    <>
      <PageMeta description="Permission is required to access this page." title="Permission Required | Mobee Suite" />
      <Container maxWidth="sm" sx={{ alignItems: "center", display: "flex", minHeight: "calc(100vh - 150px)", py: 5 }}>
        <Box sx={{ textAlign: "center", width: "100%" }}>
          <Paper elevation={0} sx={{ alignItems: "center", bgcolor: "primary.main", borderRadius: "50%", color: "primary.contrastText", display: "flex", height: { xs: 150, sm: 220 }, justifyContent: "center", mx: "auto", width: { xs: 150, sm: 220 } }}>
            <LockOutlinedIcon sx={{ fontSize: { xs: 70, sm: 100 } }} />
          </Paper>
          <Typography sx={{ mt: 4 }} variant="h3">Permission Required</Typography>
          <Typography color="text.secondary" sx={{ mt: 2 }}>Oops. Looks like you don&apos;t have permission to access this page.</Typography>
          <Typography color="text.secondary" variant="body2">Please contact an administrator if you need access.</Typography>
        </Box>
      </Container>
    </>
  );
}
