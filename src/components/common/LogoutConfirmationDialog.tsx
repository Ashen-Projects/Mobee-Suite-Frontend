import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";

type LogoutConfirmationDialogProps = {
  isLoggingOut: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
};

export default function LogoutConfirmationDialog({ isLoggingOut, onCancel, onConfirm, open }: LogoutConfirmationDialogProps) {
  return <Dialog aria-describedby="logout-confirmation-description" fullWidth maxWidth="xs" onClose={() => !isLoggingOut && onCancel()} open={open}>
    <DialogTitle>Confirm Logout</DialogTitle>
    <DialogContent dividers><Typography color="text.secondary" id="logout-confirmation-description">Are you sure you want to log out of Mobee Suite?</Typography></DialogContent>
    <DialogActions sx={{ px: 3, py: 2 }}><Button color="inherit" disabled={isLoggingOut} onClick={onCancel}>Cancel</Button><Button color="error" disabled={isLoggingOut} onClick={onConfirm} startIcon={<LogoutOutlinedIcon />} variant="contained">{isLoggingOut ? "Logging out..." : "Yes, Logout"}</Button></DialogActions>
  </Dialog>;
}
