import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { Alert, Box, Button, Card, CardContent, IconButton, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router";
import { PATH_AFTER_LOGIN } from "../../config";
import useAuth from "../../hooks/useAuth";
import { ApiError } from "../../utils/axios";

const LOGIN_BLOCKED_UNTIL_KEY = "mobee:login-blocked-until";
const DEFAULT_BLOCK_SECONDS = 5 * 60;

const getStoredBlockedUntil = (): number => {
  const value = Number.parseInt(localStorage.getItem(LOGIN_BLOCKED_UNTIL_KEY) ?? "0", 10);
  return Number.isFinite(value) && value > Date.now() ? value : 0;
};

const formatRemainingTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
};

export default function SignInForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [blockedUntil, setBlockedUntil] = useState(getStoredBlockedUntil);
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    Math.max(0, Math.ceil((getStoredBlockedUntil() - Date.now()) / 1000)),
  );

  useEffect(() => {
    if (!blockedUntil) {
      setRemainingSeconds(0);
      return;
    }

    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((blockedUntil - Date.now()) / 1000));
      setRemainingSeconds(remaining);

      if (remaining === 0) {
        localStorage.removeItem(LOGIN_BLOCKED_UNTIL_KEY);
        setBlockedUntil(0);
      }
    };

    updateCountdown();
    const intervalId = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(intervalId);
  }, [blockedUntil]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (remainingSeconds > 0) return;

    setIsSubmitting(true);
    try {
      await login({ email: email.trim().toLowerCase(), password });
      toast.success("Login successful.");
      navigate(PATH_AFTER_LOGIN, { replace: true });
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) {
        const retryAfterSeconds = error.retryAfterSeconds ?? DEFAULT_BLOCK_SECONDS;
        const nextBlockedUntil = Date.now() + retryAfterSeconds * 1000;
        localStorage.setItem(LOGIN_BLOCKED_UNTIL_KEY, String(nextBlockedUntil));
        setBlockedUntil(nextBlockedUntil);
        setRemainingSeconds(retryAfterSeconds);
      }
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
          {remainingSeconds > 0 && (
            <Alert severity="warning" variant="outlined">
              Too many login attempts. Try again in {formatRemainingTime(remainingSeconds)}.
            </Alert>
          )}
          <Button disabled={isSubmitting || remainingSeconds > 0} fullWidth size="large" type="submit" variant="contained">
            {isSubmitting
              ? "Signing in…"
              : remainingSeconds > 0
                ? `Try again in ${formatRemainingTime(remainingSeconds)}`
                : "Login"}
          </Button>
          <Alert severity="info" variant="outlined">If you forgot your password, please contact the administrator.</Alert>
        </Stack>
      </CardContent>
    </Card>
  );
}
