import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, IconButton, Stack, Typography } from "@mui/material";

type LogoutConfirmationDialogProps = {
  isLoggingOut: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
};

export default function LogoutConfirmationDialog({ isLoggingOut, onCancel, onConfirm, open }: LogoutConfirmationDialogProps) {
  const handleClose = () => {
    if (!isLoggingOut) onCancel();
  };

  return (
    <Dialog
      aria-describedby="logout-confirmation-description"
      aria-labelledby="logout-confirmation-title"
      disableEscapeKeyDown={isLoggingOut}
      fullWidth
      maxWidth="xs"
      onClose={handleClose}
      open={open}
      slotProps={{
        backdrop: { sx: { backdropFilter: "blur(3px)", bgcolor: "rgba(0, 0, 0, 0.62)" } },
        paper: {
          sx: {
            border: 1,
            borderColor: "divider",
            borderRadius: 3,
            boxShadow: "0 24px 64px rgba(0, 0, 0, 0.34)",
            m: 2,
            overflow: "hidden",
          },
        },
      }}
    >
      <DialogContent sx={{ px: { xs: 2.5, sm: 3.5 }, pb: 2.5, pt: { xs: 3, sm: 3.5 }, textAlign: "center" }}>
        <IconButton
          aria-label="Close logout confirmation"
          disabled={isLoggingOut}
          onClick={handleClose}
          size="small"
          sx={{ position: "absolute", right: 12, top: 12 }}
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>

        <Stack alignItems="center" spacing={2}>
          <Box
            sx={{
              alignItems: "center",
              bgcolor: "primary.main",
              borderRadius: "50%",
              color: "primary.contrastText",
              display: "flex",
              height: 56,
              justifyContent: "center",
              width: 56,
            }}
          >
            <LogoutRoundedIcon sx={{ fontSize: 27 }} />
          </Box>

          <Box>
            <Typography fontWeight={700} id="logout-confirmation-title" variant="h6">
              Log out of Mobee Suite?
            </Typography>
            <Typography color="text.secondary" id="logout-confirmation-description" mt={0.75} variant="body2">
              Your current session will end and you will need to sign in again to continue.
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          bgcolor: "action.hover",
          borderTop: 1,
          borderColor: "divider",
          flexDirection: { xs: "column-reverse", sm: "row" },
          gap: 1,
          px: { xs: 2.5, sm: 3.5 },
          py: 2,
          "& > :not(style) ~ :not(style)": { ml: 0 },
        }}
      >
        <Button disabled={isLoggingOut} fullWidth onClick={handleClose} variant="outlined">
          Stay logged in
        </Button>
        <Button
          disabled={isLoggingOut}
          fullWidth
          onClick={onConfirm}
          startIcon={isLoggingOut ? <CircularProgress color="inherit" size={17} /> : <LogoutRoundedIcon />}
          variant="contained"
        >
          {isLoggingOut ? "Logging out..." : "Log out"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
