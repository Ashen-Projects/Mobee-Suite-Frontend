import CloudinaryImageUploader from "../common/CloudinaryImageUploader";
import type { RepairPhotoAsset } from "../../redux/slices/repairRedux/repairRedux";

type Props = {
  disabled?: boolean;
  description: string;
  label: string;
  onChange: (photos: RepairPhotoAsset[]) => void;
  onUploadStateChange?: (isUploading: boolean) => void;
  photos: RepairPhotoAsset[];
  required?: boolean;
};

/** Repair-specific wording over the shared, folder-named image uploader. */
export default function RepairPhotoUploader({ photos, ...props }: Props) {
  return <CloudinaryImageUploader {...props} folderName="mobee/repairs" value={photos} />;
}
