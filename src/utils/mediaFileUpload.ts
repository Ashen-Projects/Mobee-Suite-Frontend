import { deleteMethod, uploadFile } from "../inteceptor";

/**
 * File folders are declared where the uploader is rendered. The browser sends
 * only this approved API key; the API validates it again and checks permissions.
 */
export const MEDIA_FILE_FOLDERS = {
  "mobee/grn-invoices": "grnInvoices",
} as const;

export type MediaFileFolderName = keyof typeof MEDIA_FILE_FOLDERS;

export type CloudinaryUploadedFile = {
  bytes: number;
  format: string;
  publicId: string;
  url: string;
};

export type MediaFileAsset = Pick<CloudinaryUploadedFile, "publicId" | "url"> & { fileName: string };

export const uploadMediaFile = async (
  file: File,
  folderName: MediaFileFolderName,
  onProgress?: (progress: number) => void,
): Promise<CloudinaryUploadedFile> => {
  const formData = new FormData();
  formData.append("file", file);
  return (await uploadFile<CloudinaryUploadedFile>(`media/files/${MEDIA_FILE_FOLDERS[folderName]}`, formData, {
    onUploadProgress: (event) => {
      if (event.total) onProgress?.(Math.min(100, Math.round((event.loaded / event.total) * 100)));
    },
  })).data;
};

export const deleteMediaFile = async (folderName: MediaFileFolderName, publicId: string): Promise<void> => {
  await deleteMethod<{ publicId: string }>(`media/files/${MEDIA_FILE_FOLDERS[folderName]}`, { publicId }, undefined, false, { trackLoading: false });
};
