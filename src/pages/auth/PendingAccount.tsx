import HourglassTopRoundedIcon from "@mui/icons-material/HourglassTopRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { Box, Button, Container, Paper, Stack, Typography } from "@mui/material";
import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import LogoutConfirmationDialog from "../../components/common/LogoutConfirmationDialog";
import useAuth from "../../hooks/useAuth";

export default function PendingAccount() {
  const { logout, user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try { await logout(); setLogoutDialogOpen(false); } finally { setIsLoggingOut(false); }
  };

  return (
    <>
      <PageMeta description="Your Mobee account is waiting for administrator approval." title="Approval Pending | Mobee Suite" />
      <Container maxWidth="sm" sx={{ alignItems: "center", display: "flex", minHeight: "100vh", py: 4 }}>
        <Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 4, p: { xs: 3, sm: 5 }, textAlign: "center", width: "100%" }}>
          <Stack alignItems="center" spacing={2.5}>
            <Box sx={{ alignItems: "center", bgcolor: "primary.main", borderRadius: "50%", color: "primary.contrastText", display: "flex", height: 104, justifyContent: "center", width: 104 }}>
              <HourglassTopRoundedIcon sx={{ fontSize: 52 }} />
            </Box>
            <Box>
              <Typography variant="h4">Account approval pending</Typography>
              <Typography color="text.secondary" mt={1.5}>
                Hello {user?.displayName || "Mobee user"}. You can sign in, but an administrator must assign your role before you can use Mobee Suite.
              </Typography>
            </Box>
            <Typography color="text.secondary" variant="body2">Please contact your administrator if you need access.</Typography>
            <Button disabled={isLoggingOut} onClick={() => setLogoutDialogOpen(true)} startIcon={<LogoutRoundedIcon />} variant="outlined">
              Logout
            </Button>
          </Stack>
        </Paper>
      </Container>
      <LogoutConfirmationDialog isLoggingOut={isLoggingOut} onCancel={() => setLogoutDialogOpen(false)} onConfirm={() => void handleLogout()} open={logoutDialogOpen} />
    </>
  );
}
