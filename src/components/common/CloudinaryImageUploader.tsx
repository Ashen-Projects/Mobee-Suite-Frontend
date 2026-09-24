import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { Box, Button, Chip, CircularProgress, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { deleteMediaImage, uploadMediaImage, type MediaImageAsset, type MediaImageFolderName } from "../../utils/mediaImageUpload";
import ImagePreviewDialog, { type PreviewableImage } from "./ImagePreviewDialog";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type PendingImage = { file: File; id: string; previewUrl: string };
type UploadedImageRenderProps = {
  disabled: boolean;
  onRemove: () => void;
};
type Props = {
  description: string;
  disabled?: boolean;
  folderName: MediaImageFolderName;
  label: string;
  maxImages?: number;
  onChange: (images: MediaImageAsset[]) => void;
  onRemoveUploadedImage?: (image: MediaImageAsset) => Promise<void> | void;
  onUploadStateChange?: (isUploading: boolean) => void;
  renderUploadedImageDetails?: (image: MediaImageAsset, index: number, props: UploadedImageRenderProps) => React.ReactNode;
  required?: boolean;
  value: MediaImageAsset[];
};

const revokePreviews = (images: PendingImage[]) => images.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl));

/** Reusable uploader. The Cloudinary folder name is declared where it is used. */
export default function CloudinaryImageUploader({
  description,
  disabled = false,
  folderName,
  label,
  maxImages = 10,
  onChange,
  onRemoveUploadedImage,
  onUploadStateChange,
  required = false,
  renderUploadedImageDetails,
  value,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingRef = useRef<PendingImage[]>([]);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<PreviewableImage | null>(null);

  useEffect(() => { pendingRef.current = pendingImages; }, [pendingImages]);
  useEffect(() => () => revokePreviews(pendingRef.current), []);
  useEffect(() => { onUploadStateChange?.(isUploading); }, [isUploading, onUploadStateChange]);

  const remainingSlots = maxImages - value.length - pendingImages.length;
  const clearPendingImages = useCallback(() => {
    setPendingImages((current) => {
      revokePreviews(current);
      return [];
    });
  }, []);

  const selectFiles = useCallback((files: FileList | File[]) => {
    if (disabled) return;
    const selectable = Array.from(files).filter((file) => {
      if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
        toast.warning(`${file.name} is not supported. Use JPEG, PNG, or WebP.`);
        return false;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        toast.warning(`${file.name} is larger than 5 MB.`);
        return false;
      }
      return true;
    });
    if (!selectable.length) return;
    if (remainingSlots <= 0) {
      toast.info(`You can add up to ${maxImages} images.`);
      return;
    }
    const accepted = selectable.slice(0, remainingSlots);
    if (accepted.length !== selectable.length) toast.info(`Only ${accepted.length} more image${accepted.length === 1 ? "" : "s"} can be added.`);
    setPendingImages((current) => [...current, ...accepted.map((file) => ({ file, id: crypto.randomUUID(), previewUrl: URL.createObjectURL(file) }))]);
  }, [disabled, maxImages, remainingSlots]);

  const removePendingImage = useCallback((id: string) => {
    setPendingImages((current) => {
      const image = current.find((item) => item.id === id);
      if (image) URL.revokeObjectURL(image.previewUrl);
      return current.filter((item) => item.id !== id);
    });
  }, []);

  const uploadPendingImages = useCallback(async () => {
    if (!pendingImages.length || disabled || isUploading) return;
    setIsUploading(true);
    const uploaded: MediaImageAsset[] = [];
    try {
      for (const image of pendingImages) {
        const result = await uploadMediaImage(image.file, folderName);
        uploaded.push({ fileName: image.file.name, publicId: result.publicId, url: result.url });
      }
      onChange([...value, ...uploaded]);
      clearPendingImages();
      toast.success(`${uploaded.length} image${uploaded.length === 1 ? "" : "s"} uploaded.`);
    } catch (error) {
      if (uploaded.length) {
        onChange([...value, ...uploaded]);
        clearPendingImages();
      }
      toast.error(error instanceof Error ? error.message : "Unable to upload the image.");
    } finally {
      setIsUploading(false);
    }
  }, [clearPendingImages, disabled, folderName, isUploading, onChange, pendingImages, value]);

  const removeUploadedImage = useCallback(async (image: MediaImageAsset) => {
    try {
      if (onRemoveUploadedImage) {
        await onRemoveUploadedImage(image);
        return;
      }
      await deleteMediaImage(folderName, image.publicId);
      onChange(value.filter((item) => item.publicId !== image.publicId));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to remove the image.");
    }
  }, [folderName, onChange, onRemoveUploadedImage, value]);

  return <Stack spacing={1.25}>
    <Stack alignItems={{ sm: "center" }} direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={0.75}>
      <Box><Typography fontWeight={900}>{label}{required ? " *" : ""}</Typography><Typography color="text.secondary" variant="body2">{description}</Typography></Box>
      <Chip color={required && !value.length ? "warning" : "default"} label={`${value.length}/${maxImages} uploaded`} size="small" variant="outlined" />
    </Stack>
    <Box sx={{ alignItems: "center", border: 1, borderColor: "divider", borderRadius: 2, borderStyle: "dashed", display: "flex", justifyContent: "center", minHeight: 118, p: 2, textAlign: "center" }}>
      <Stack alignItems="center" spacing={0.75}>
        <AddPhotoAlternateOutlinedIcon color="primary" />
        <Typography fontWeight={800} variant="body2">Add images</Typography>
        <Typography color="text.secondary" variant="caption">JPEG, PNG, or WebP · Up to 5 MB each</Typography>
        <Button disabled={disabled || isUploading || remainingSlots <= 0} onClick={() => inputRef.current?.click()} size="small" startIcon={<AddPhotoAlternateOutlinedIcon />} variant="outlined">Choose images</Button>
        <input accept="image/jpeg,image/png,image/webp" hidden multiple onChange={(event) => { selectFiles(event.target.files ?? []); event.target.value = ""; }} ref={inputRef} type="file" />
      </Stack>
    </Box>
    {pendingImages.length ? <Box>
      <Stack alignItems="center" direction="row" justifyContent="space-between" mb={0.75}><Typography fontWeight={800} variant="body2">Ready to upload</Typography><Button color="inherit" disabled={disabled || isUploading} onClick={clearPendingImages} size="small">Clear</Button></Stack>
      <ImageGrid>{pendingImages.map((image) => <PendingImageCard disabled={disabled || isUploading} image={image} key={image.id} onRemove={() => removePendingImage(image.id)} />)}</ImageGrid>
      <Button disabled={disabled || isUploading} onClick={() => void uploadPendingImages()} size="small" startIcon={isUploading ? <CircularProgress color="inherit" size={15} /> : <CloudUploadRoundedIcon />} sx={{ mt: 1 }} variant="contained">{isUploading ? "Uploading…" : `Upload ${pendingImages.length} image${pendingImages.length === 1 ? "" : "s"}`}</Button>
    </Box> : null}
    {value.length ? <Box><Typography fontWeight={800} mb={0.75} variant="body2">Attached images</Typography><Typography color="text.secondary" display="block" mb={0.75} variant="caption">Click a photo to view it full size.</Typography><ImageGrid>{value.map((image, index) => <UploadedImageCard details={renderUploadedImageDetails?.(image, index, { disabled: disabled || isUploading, onRemove: () => void removeUploadedImage(image) })} disabled={disabled || isUploading} image={image} key={image.publicId} onPreview={() => setPreviewImage({ fileName: image.fileName, url: image.url })} onRemove={() => void removeUploadedImage(image)} />)}</ImageGrid></Box> : null}
    <ImagePreviewDialog image={previewImage} onClose={() => setPreviewImage(null)} />
  </Stack>;
}

function ImageGrid({ children }: { children: React.ReactNode }) {
  return <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: "repeat(auto-fill, minmax(128px, 1fr))" }}>{children}</Box>;
}

function PendingImageCard({ disabled, image, onRemove }: { disabled: boolean; image: PendingImage; onRemove: () => void }) {
  return <Box sx={{ border: 1, borderColor: "primary.main", borderRadius: 1.5, overflow: "hidden", position: "relative" }}><Box alt={image.file.name} component="img" src={image.previewUrl} sx={{ display: "block", height: 104, objectFit: "cover", width: "100%" }} /><RemoveImageButton disabled={disabled} label={image.file.name} onRemove={onRemove} /><Typography noWrap p={0.75} variant="caption">{image.file.name}</Typography></Box>;
}

function UploadedImageCard({ details, disabled, image, onPreview, onRemove }: { details?: React.ReactNode; disabled: boolean; image: MediaImageAsset; onPreview: () => void; onRemove: () => void }) {
  return <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, overflow: "hidden", position: "relative" }}><Box aria-label={`Preview ${image.fileName}`} component="button" onClick={onPreview} sx={{ appearance: "none", bgcolor: "transparent", border: 0, cursor: "zoom-in", display: "block", p: 0, width: "100%", "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: -2 }, "&:hover img": { transform: "scale(1.03)" } }} title={`Preview ${image.fileName}`} type="button"><Box alt={image.fileName} component="img" src={image.url} sx={{ display: "block", height: 104, objectFit: "cover", transition: "transform 160ms ease", width: "100%" }} /></Box>{details ?? <><RemoveImageButton disabled={disabled} label={image.fileName} onRemove={onRemove} /><Typography noWrap p={0.75} variant="caption">{image.fileName}</Typography></>}</Box>;
}

function RemoveImageButton({ disabled, label, onRemove }: { disabled: boolean; label: string; onRemove: () => void }) {
  return <Tooltip title="Remove image"><span><IconButton aria-label={`Remove ${label}`} color="error" disabled={disabled} onClick={onRemove} size="small" sx={{ bgcolor: "background.paper", position: "absolute", right: 4, top: 4 }}><DeleteOutlineRoundedIcon fontSize="small" /></IconButton></span></Tooltip>;
}
