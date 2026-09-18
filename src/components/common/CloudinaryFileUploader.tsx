import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import { Box, Button, Chip, CircularProgress, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { deleteMediaFile, uploadMediaFile, type MediaFileAsset, type MediaFileFolderName } from "../../utils/mediaFileUpload";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_FILE_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

type PendingFile = { file: File; id: string };
type Props = {
  description: string;
  disabled?: boolean;
  folderName: MediaFileFolderName;
  label: string;
  maxFiles?: number;
  onChange: (files: MediaFileAsset[]) => void;
  onUploadStateChange?: (isUploading: boolean) => void;
  required?: boolean;
  value: MediaFileAsset[];
};

/** Reusable secure-file uploader. The Cloudinary folder name is declared where it is used. */
export default function CloudinaryFileUploader({
  description,
  disabled = false,
  folderName,
  label,
  maxFiles = 1,
  onChange,
  onUploadStateChange,
  required = false,
  value,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => { onUploadStateChange?.(isUploading); }, [isUploading, onUploadStateChange]);

  const remainingSlots = maxFiles - value.length - pendingFiles.length;
  const selectFiles = useCallback((files: FileList | File[]) => {
    if (disabled || remainingSlots <= 0) return;
    const selectable = Array.from(files).filter((file) => {
      if (!ACCEPTED_FILE_TYPES.has(file.type)) {
        toast.warning(`${file.name} is not supported. Use PDF, JPEG, PNG, or WebP.`);
        return false;
      }
      if (file.size > MAX_FILE_BYTES) {
        toast.warning(`${file.name} is larger than 10 MB.`);
        return false;
      }
      return true;
    });
    if (!selectable.length) return;
    const accepted = selectable.slice(0, remainingSlots);
    if (accepted.length !== selectable.length) toast.info(`Only ${accepted.length} more file${accepted.length === 1 ? "" : "s"} can be added.`);
    setPendingFiles((current) => [...current, ...accepted.map((file) => ({ file, id: crypto.randomUUID() }))]);
  }, [disabled, remainingSlots]);

  const uploadPendingFiles = useCallback(async () => {
    if (!pendingFiles.length || disabled || isUploading) return;
    setIsUploading(true);
    const uploaded: MediaFileAsset[] = [];
    try {
      for (const item of pendingFiles) {
        const result = await uploadMediaFile(item.file, folderName);
        uploaded.push({ fileName: item.file.name, publicId: result.publicId, url: result.url });
      }
      onChange([...value, ...uploaded]);
      setPendingFiles([]);
      toast.success(`${uploaded.length} invoice file${uploaded.length === 1 ? "" : "s"} uploaded.`);
    } catch (error) {
      if (uploaded.length) {
        onChange([...value, ...uploaded]);
        setPendingFiles([]);
      }
      toast.error(error instanceof Error ? error.message : "Unable to upload the invoice file.");
    } finally {
      setIsUploading(false);
    }
  }, [disabled, folderName, isUploading, onChange, pendingFiles, value]);

  const removePendingFile = useCallback((id: string) => {
    setPendingFiles((current) => current.filter((item) => item.id !== id));
  }, []);

  const removeUploadedFile = useCallback(async (file: MediaFileAsset) => {
    try {
      await deleteMediaFile(folderName, file.publicId);
      onChange(value.filter((item) => item.publicId !== file.publicId));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to remove the invoice file.");
    }
  }, [folderName, onChange, value]);

  return <Stack spacing={1.25}>
    <Stack alignItems={{ sm: "center" }} direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={0.75}>
      <Box><Typography fontWeight={900}>{label}{required ? " *" : ""}</Typography><Typography color="text.secondary" variant="body2">{description}</Typography></Box>
      <Chip color={required && !value.length ? "warning" : "default"} label={`${value.length}/${maxFiles} attached`} size="small" variant="outlined" />
    </Stack>
    <Box sx={{ alignItems: "center", border: 1, borderColor: "divider", borderRadius: 2, borderStyle: "dashed", display: "flex", justifyContent: "center", minHeight: 112, p: 2, textAlign: "center" }}>
      <Stack alignItems="center" spacing={0.75}>
        <AttachFileRoundedIcon color="primary" />
        <Typography fontWeight={800} variant="body2">Add supplier invoice</Typography>
        <Typography color="text.secondary" variant="caption">PDF, JPEG, PNG, or WebP · Up to 10 MB</Typography>
        <Button disabled={disabled || isUploading || remainingSlots <= 0} onClick={() => inputRef.current?.click()} size="small" startIcon={<AttachFileRoundedIcon />} variant="outlined">Choose file</Button>
        <input accept="application/pdf,image/jpeg,image/png,image/webp" hidden onChange={(event) => { selectFiles(event.target.files ?? []); event.target.value = ""; }} ref={inputRef} type="file" />
      </Stack>
    </Box>
    {pendingFiles.length ? <Stack spacing={0.75}><Typography fontWeight={800} variant="body2">Ready to upload</Typography>{pendingFiles.map((item) => <FileRow actions={<Tooltip key="remove" title="Remove selected file"><span><IconButton aria-label={`Remove ${item.file.name}`} disabled={disabled || isUploading} onClick={() => removePendingFile(item.id)} size="small"><DeleteOutlineRoundedIcon fontSize="small" /></IconButton></span></Tooltip>} fileName={item.file.name} key={item.id} />)}<Button disabled={disabled || isUploading} onClick={() => void uploadPendingFiles()} size="small" startIcon={isUploading ? <CircularProgress color="inherit" size={15} /> : <CloudUploadRoundedIcon />} sx={{ alignSelf: "flex-start" }} variant="contained">{isUploading ? "Uploading…" : "Upload invoice"}</Button></Stack> : null}
    {value.length ? <Stack spacing={0.75}><Typography fontWeight={800} variant="body2">Attached invoice</Typography>{value.map((item) => <FileRow actions={<><Tooltip title="Open invoice"><IconButton aria-label={`Open ${item.fileName}`} component="a" href={item.url} rel="noreferrer" size="small" target="_blank"><OpenInNewRoundedIcon fontSize="small" /></IconButton></Tooltip><Tooltip title="Remove invoice"><span><IconButton aria-label={`Remove ${item.fileName}`} disabled={disabled || isUploading} onClick={() => void removeUploadedFile(item)} size="small"><DeleteOutlineRoundedIcon fontSize="small" /></IconButton></span></Tooltip></>} fileName={item.fileName} key={item.publicId} />)}</Stack> : null}
  </Stack>;
}

function FileRow({ actions, fileName }: { actions: React.ReactNode; fileName: string }) {
  const isPdf = fileName.toLowerCase().endsWith(".pdf");
  return <Stack alignItems="center" direction="row" gap={1} sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, p: 1 }}><Box color="primary.main" display="flex">{isPdf ? <PictureAsPdfOutlinedIcon /> : <AttachFileRoundedIcon />}</Box><Typography flex={1} noWrap variant="body2">{fileName}</Typography><Stack direction="row">{actions}</Stack></Stack>;
}
