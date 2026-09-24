import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { downloadMediaFile, getPreviewableMediaFileBlob, type MediaFileFolderName } from "../../utils/mediaFileUpload";

export type PreviewableFile = {
  file?: File;
  fileName: string;
  fileUrl?: string;
  publicId?: string;
};

type Props = {
  file: PreviewableFile | null;
  folderName?: MediaFileFolderName;
  onClose: () => void;
};

const pdfFile = (name: string, contentType?: string) =>
  contentType === "application/pdf" || name.toLowerCase().endsWith(".pdf");

const safeDownload = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};

/**
 * Shows an uploaded PDF or image in the application. GRN files are loaded
 * through the authenticated API. A stored Cloudinary URL is used only as a
 * fallback when the API host cannot retrieve the raw file.
 */
export default function FilePreviewDialog({ file, folderName, onClose }: Props) {
  const [contentType, setContentType] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let url: string | null = null;
    setContentType("");
    setError(null);
    setObjectUrl(null);

    if (!file) return () => undefined;

    const load = async () => {
      setLoading(true);
      try {
        let blob: Blob;
        if (file.file) {
          blob = file.file;
        } else if (folderName && file.publicId) {
          blob = await getPreviewableMediaFileBlob(folderName, file.publicId, file.fileUrl);
        } else if (file.fileUrl) {
          const response = await fetch(file.fileUrl);
          if (!response.ok) throw new Error("The file could not be loaded for preview.");
          blob = await response.blob();
        } else {
          throw new Error("This file has no preview source.");
        }

        if (!active) return;
        url = URL.createObjectURL(blob);
        setContentType(blob.type);
        setObjectUrl(url);
      } catch {
        if (active) setError("Preview could not be loaded. Download the original supplier invoice instead.");
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [file, folderName]);

  const isPdf = useMemo(() => pdfFile(file?.fileName ?? "", contentType), [contentType, file?.fileName]);

  const download = async () => {
    if (!file) return;
    if (file.file) {
      safeDownload(file.file, file.fileName);
      return;
    }
    if (folderName && file.publicId) {
      await downloadMediaFile(folderName, file.publicId, file.fileName, file.fileUrl);
      return;
    }
    if (file.fileUrl) window.open(file.fileUrl, "_blank", "noopener,noreferrer");
  };

  return <Dialog fullScreen fullWidth maxWidth="lg" onClose={onClose} open={Boolean(file)} PaperProps={{ sx: { bgcolor: "background.default" } }}>
    <DialogTitle component="div" sx={{ alignItems: "center", display: "flex", gap: 1.25, pr: 2 }}>
      <PictureAsPdfOutlinedIcon color="primary" />
      <Box minWidth={0} flex={1}>
        <Typography fontWeight={800} noWrap>{file?.fileName ?? "File preview"}</Typography>
        <Typography color="text.secondary" variant="caption">Preview a saved supplier document without leaving the GRN.</Typography>
      </Box>
      <Button disabled={!file} onClick={() => void download()} size="small" startIcon={<DownloadRoundedIcon />} variant="outlined">Download</Button>
    </DialogTitle>
    <DialogContent dividers sx={{ alignItems: "center", display: "flex", justifyContent: "center", minHeight: 0, p: { xs: 1, sm: 2 } }}>
      {loading ? <Stack alignItems="center" spacing={1.25}><CircularProgress /><Typography color="text.secondary" variant="body2">Loading document preview…</Typography></Stack> : null}
      {!loading && error ? <Stack alignItems="center" maxWidth={520} spacing={2}><Alert severity="error">{error}</Alert>{file ? <Button onClick={() => void download()} startIcon={<DownloadRoundedIcon />} variant="outlined">Download original file</Button> : null}</Stack> : null}
      {!loading && !error && objectUrl && isPdf ? <Box component="iframe" src={objectUrl} sx={{ bgcolor: "common.white", border: 0, height: "calc(100vh - 165px)", minHeight: 420, width: "100%" }} title={file?.fileName ?? "Supplier invoice preview"} /> : null}
      {!loading && !error && objectUrl && !isPdf ? <Box alt={file?.fileName ?? "Supplier document"} component="img" src={objectUrl} sx={{ maxHeight: "calc(100vh - 175px)", maxWidth: "100%", objectFit: "contain" }} /> : null}
      {!loading && !error && !objectUrl ? <Stack alignItems="center" spacing={1}><VisibilityOffOutlinedIcon color="disabled" /><Typography color="text.secondary">No preview is available.</Typography></Stack> : null}
    </DialogContent>
    <DialogActions><Button color="inherit" onClick={onClose}>Close</Button></DialogActions>
  </Dialog>;
}
