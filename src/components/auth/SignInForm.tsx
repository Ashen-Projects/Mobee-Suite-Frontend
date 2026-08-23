import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { Alert, Box, Button, Card, CardContent, IconButton, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import { useState, type FormEvent } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router";
import { PATH_AFTER_LOGIN } from "../../config";
import useAuth from "../../hooks/useAuth";

export default function SignInForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await login({ email: email.trim().toLowerCase(), password });
      toast.success("Login successful.");
      navigate(PATH_AFTER_LOGIN, { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card sx={{ maxWidth: 440, width: "100%" }}>
      <CardContent sx={{ p: { xs: 3, sm: 4 }, "&:last-child": { pb: { xs: 3, sm: 4 } } }}>
        <Stack component="form" onSubmit={handleSubmit} spacing={2.5}>
          <Box textAlign="center">
            <Typography fontWeight={600} variant="h4">Sign in</Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">Enter your account details to access Mobee.</Typography>
          </Box>
          <TextField autoComplete="email" fullWidth label="Email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
          <TextField
            autoComplete="current-password"
            fullWidth
            label="Password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type={showPassword ? "text" : "password"}
            value={password}
            slotProps={{ input: { endAdornment: <InputAdornment position="end"><IconButton aria-label={showPassword ? "Hide password" : "Show password"} edge="end" onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}</IconButton></InputAdornment> } }}
          />
          <Button disabled={isSubmitting} fullWidth size="large" type="submit" variant="contained">
            {isSubmitting ? "Signing in…" : "Login"}
          </Button>
          <Alert severity="info" variant="outlined">If you forgot your password, please contact the administrator.</Alert>
        </Stack>
      </CardContent>
    </Card>
  );
}
