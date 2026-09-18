import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import { Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { useCallback, useMemo, useState } from "react";
import CloudinaryImageUploader from "../common/CloudinaryImageUploader";
import type { MediaImageAsset } from "../../utils/mediaImageUpload";
import type { ProductImageInput } from "../../redux/slices/productRedux/productRedux";

const MAX_PRODUCT_IMAGES = 20;

export type ProductFormImage = ProductImageInput & {
  clientId: string;
  isPersisted: boolean;
  uploadProgress?: number;
  uploading?: boolean;
};

type Props = {
  images: ProductFormImage[];
  onChange: (images: ProductFormImage[]) => void;
  onClose: () => void;
  onDelete: (index: number) => Promise<void> | void;
  onSetPrimary: (index: number) => void;
  onUpdate: (index: number, values: Partial<ProductImageInput>) => void;
  open: boolean;
};

export default function ProductImageUploadDialog({ images, onChange, onClose, onDelete, onSetPrimary, onUpdate, open }: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const cloudinaryImages = useMemo<MediaImageAsset[]>(() => images.flatMap((image, index) => {
    if (!image.cloudinaryPublicId || !image.url) return [];
    return [{ fileName: image.altText?.trim() || `Product image ${index + 1}`, publicId: image.cloudinaryPublicId, url: image.url }];
  }), [images]);

  const replaceCloudinaryImages = useCallback((nextAssets: MediaImageAsset[]) => {
    const currentByPublicId = new Map(images
      .filter((image): image is ProductFormImage & { cloudinaryPublicId: string } => Boolean(image.cloudinaryPublicId))
      .map((image) => [image.cloudinaryPublicId, image]));
    const unmanagedImages = images.filter((image) => !image.cloudinaryPublicId);
    const hasPrimary = images.some((image) => image.isPrimary);
    const managedImages = nextAssets.map((asset, index): ProductFormImage => {
      const current = currentByPublicId.get(asset.publicId);
      if (current) return { ...current, priority: unmanagedImages.length + index, url: asset.url };
      return {
        altText: null,
        clientId: crypto.randomUUID(),
        cloudinaryPublicId: asset.publicId,
        isPersisted: false,
        isPrimary: !hasPrimary && !unmanagedImages.length && index === 0,
        priority: unmanagedImages.length + index,
        url: asset.url,
      };
    });
    const nextImages = [...unmanagedImages, ...managedImages].map((image, index) => ({ ...image, priority: index }));
    if (nextImages.length && !nextImages.some((image) => image.isPrimary)) nextImages[0] = { ...nextImages[0], isPrimary: true };
    onChange(nextImages);
  }, [images, onChange]);

  const removeCloudinaryImage = useCallback(async (asset: MediaImageAsset) => {
    const index = images.findIndex((image) => image.cloudinaryPublicId === asset.publicId);
    if (index >= 0) await onDelete(index);
  }, [images, onDelete]);

  const renderImageDetails = useCallback((asset: MediaImageAsset, _index: number, { disabled, onRemove }: { disabled: boolean; onRemove: () => void }) => {
    const index = images.findIndex((image) => image.cloudinaryPublicId === asset.publicId);
    const image = images[index];
    if (!image) return null;
    return <Stack gap={0.75} p={1}>
      {image.isPrimary ? <Chip color="primary" icon={<StarRoundedIcon />} label="Primary" size="small" sx={{ alignSelf: "flex-start" }} /> : null}
      <TextField disabled={disabled} label="Alt text" onChange={(event) => onUpdate(index, { altText: event.target.value })} size="small" value={image.altText ?? ""} />
      <Stack alignItems="center" direction="row" justifyContent="space-between">
        <Button disabled={disabled || image.isPrimary} onClick={() => onSetPrimary(index)} size="small" startIcon={<StarRoundedIcon />}>{image.isPrimary ? "Primary image" : "Set primary"}</Button>
        <Tooltip title="Remove image"><span><IconButton aria-label={`Remove product image ${index + 1}`} color="error" disabled={disabled} onClick={onRemove} size="small"><DeleteOutlineRoundedIcon fontSize="small" /></IconButton></span></Tooltip>
      </Stack>
    </Stack>;
  }, [images, onSetPrimary, onUpdate]);

  return <Dialog fullWidth maxWidth="md" onClose={() => { if (!isUploading) onClose(); }} open={open}>
    <DialogTitle component="div">
      <Typography variant="h5">Product images</Typography>
      <Typography color="text.secondary" variant="body2">Add product photos, choose the primary image, and add accessible alt text.</Typography>
    </DialogTitle>
    <Divider />
    <DialogContent dividers>
      <CloudinaryImageUploader
        description="JPEG, PNG, or WebP · Up to 5 MB each · Choose a primary image before saving the product."
        folderName="mobee/products"
        label="Product photos"
        maxImages={MAX_PRODUCT_IMAGES}
        onChange={replaceCloudinaryImages}
        onRemoveUploadedImage={removeCloudinaryImage}
        onUploadStateChange={setIsUploading}
        renderUploadedImageDetails={renderImageDetails}
        value={cloudinaryImages}
      />
    </DialogContent>
    <DialogActions sx={{ px: 3, py: 2 }}><Button color="inherit" disabled={isUploading} onClick={onClose}>Done</Button></DialogActions>
  </Dialog>;
}
