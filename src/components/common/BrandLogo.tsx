import { Box, type SxProps, type Theme } from "@mui/material";
import { useTheme } from "../../context/ThemeContext";

type BrandLogoProps = { compact?: boolean; className?: string; sx?: SxProps<Theme> };

export default function BrandLogo({ compact = false, sx }: BrandLogoProps) {
  const { theme } = useTheme();
  const source = theme === "dark"
    ? "https://res.cloudinary.com/gxsancbf/image/upload/v1787844244/mobee-suite-3.png"
    : "https://res.cloudinary.com/gxsancbf/image/upload/v1787844231/Mobee-suite.png";

  return (
    <Box
      alt="Mobee Suite"
      component="img"
      src={source}
      sx={[{ borderRadius: 1.25, display: "block", height: compact ? 36 : "auto", maxHeight: 52, objectFit: "contain", width: compact ? 46 : 184 }, ...(Array.isArray(sx) ? sx : [sx]) ]}
    />
  );
}
