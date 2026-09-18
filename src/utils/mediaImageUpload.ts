import { deleteMethod, uploadFile } from "../inteceptor";

/**
 * Folder names are declared by the component using the uploader. The browser
 * sends only the approved internal route key resolved here; the API validates
 * it again and enforces the related module permissions.
 */
export const MEDIA_IMAGE_FOLDERS = {
  "mobee/products": "productImages",
  "mobee/repairs": "repairImages",
} as const;

export type MediaImageFolderName = keyof typeof MEDIA_IMAGE_FOLDERS;

export type CloudinaryUploadedImage = {
  bytes: number;
  format: string;
  height: number;
  publicId: string;
  url: string;
  width: number;
};

export type MediaImageAsset = Pick<CloudinaryUploadedImage, "publicId" | "url"> & { fileName: string };

export const uploadMediaImage = async (
  file: File,
  folderName: MediaImageFolderName,
  onProgress?: (progress: number) => void,
): Promise<CloudinaryUploadedImage> => {
  const formData = new FormData();
  formData.append("file", file);
  return (await uploadFile<CloudinaryUploadedImage>(`media/images/${MEDIA_IMAGE_FOLDERS[folderName]}`, formData, {
    onUploadProgress: (event) => {
      if (event.total) onProgress?.(Math.min(100, Math.round((event.loaded / event.total) * 100)));
    },
  })).data;
};

export const deleteMediaImage = async (folderName: MediaImageFolderName, publicId: string): Promise<void> => {
  await deleteMethod<{ publicId: string }>(`media/images/${MEDIA_IMAGE_FOLDERS[folderName]}`, { publicId }, undefined, false, { trackLoading: false });
};
