import { LinearProgress } from "@mui/material";
import { useAppSelector } from "../../redux/store";

export default function GlobalTopLoader() {
  const isVisible = useAppSelector((state) => state.loading.activeRequests > 0);

  if (!isVisible) return null;

  return (
    <LinearProgress
      aria-label="Loading"
      color="inherit"
      sx={{
        bgcolor: "transparent",
        height: 3,
        left: 0,
        pointerEvents: "none",
        position: "fixed",
        right: 0,
        top: 0,
        width: "100%",
        zIndex: 2147483647,
        "& .MuiLinearProgress-bar": {
          bgcolor: "#d99100",
          boxShadow: "0 0 8px rgba(217, 145, 0, 0.75)",
        },
      }}
    />
  );
}
