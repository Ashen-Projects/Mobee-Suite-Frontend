import { deleteMethod, uploadFile } from "../inteceptor";
import { apiClient } from "./axios";

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

/** Retrieves a file as an authenticated blob for reliable in-app preview. */
export const getMediaFileBlob = async (folderName: MediaFileFolderName, publicId: string): Promise<Blob> =>
  (await apiClient.get<Blob>(`media/files/${MEDIA_FILE_FOLDERS[folderName]}/content`, {
    params: { publicId },
    responseType: "blob",
    trackLoading: false,
  })).data;

const getCloudinaryFileBlob = async (fileUrl: string): Promise<Blob> => {
  const response = await fetch(fileUrl, { credentials: "omit" });
  if (!response.ok) throw new Error("The stored invoice file could not be loaded.");
  const blob = await response.blob();
  if (!blob.size) throw new Error("The stored invoice file is empty.");
  return blob;
};

/**
 * Loads a stored file through the protected API first. Cloudinary's signed/raw
 * delivery can occasionally be temporarily unavailable to the API host, so a
 * previously saved Cloudinary URL is retained as a browser-side fallback.
 */
export const getPreviewableMediaFileBlob = async (
  folderName: MediaFileFolderName,
  publicId: string,
  fallbackFileUrl?: string,
): Promise<Blob> => {
  try {
    return await getMediaFileBlob(folderName, publicId);
  } catch (securePreviewError) {
    if (!fallbackFileUrl) throw securePreviewError;
    try {
      return await getCloudinaryFileBlob(fallbackFileUrl);
    } catch {
      throw new Error("Preview could not be loaded. Download the original supplier invoice instead.");
    }
  }
};

const triggerDirectDownload = (fileUrl: string, fileName: string) => {
  const link = document.createElement("a");
  link.download = fileName;
  link.href = fileUrl;
  link.rel = "noreferrer";
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  link.remove();
};

/** Downloads a GRN file with the original file name. */
export const downloadMediaFile = async (
  folderName: MediaFileFolderName,
  publicId: string,
  fileName: string,
  fallbackFileUrl?: string,
): Promise<void> => {
  try {
    const blob = await getPreviewableMediaFileBlob(folderName, publicId, fallbackFileUrl);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = fileName;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  } catch (error) {
    if (!fallbackFileUrl) throw error;
    triggerDirectDownload(fallbackFileUrl, fileName);
  }
};
