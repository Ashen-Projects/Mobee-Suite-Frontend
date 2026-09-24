import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { Box, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Button, Typography } from "@mui/material";

export type PreviewableImage = {
  altText?: string | null;
  fileName: string;
  url: string;
};

type Props = {
  image: PreviewableImage | null;
  onClose: () => void;
};

/** Displays an already loaded Cloudinary image without downloading a separate file. */
export default function ImagePreviewDialog({ image, onClose }: Props) {
  return <Dialog fullScreen onClose={onClose} open={Boolean(image)} PaperProps={{ sx: { bgcolor: "background.default" } }}>
    <DialogTitle component="div" sx={{ alignItems: "center", display: "flex", gap: 1, pr: 1 }}>
      <Box flex={1} minWidth={0}>
        <Typography fontWeight={800} noWrap>{image?.fileName ?? "Image preview"}</Typography>
        <Typography color="text.secondary" variant="caption">{image?.altText?.trim() || "Product image preview"}</Typography>
      </Box>
      <IconButton aria-label="Close image preview" onClick={onClose}><CloseRoundedIcon /></IconButton>
    </DialogTitle>
    <DialogContent dividers sx={{ alignItems: "center", display: "flex", justifyContent: "center", p: { xs: 1, sm: 2 } }}>
      {image ? <Box alt={image.altText?.trim() || image.fileName} component="img" src={image.url} sx={{ display: "block", maxHeight: "calc(100vh - 150px)", maxWidth: "100%", objectFit: "contain" }} /> : null}
    </DialogContent>
    <DialogActions><Button color="inherit" onClick={onClose}>Close</Button></DialogActions>
  </Dialog>;
}
