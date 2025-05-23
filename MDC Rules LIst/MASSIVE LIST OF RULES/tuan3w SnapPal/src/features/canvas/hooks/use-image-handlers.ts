import { useCallback } from "react";
import { useDrawPilotStore } from "@/store";
import { toast } from "sonner";

export const useImageHandlers = () => {
	const { setImage, setOriginalImage, setIsUploadDialogOpen } = useDrawPilotStore();

	const handleImageUpload = useCallback(
		async (file: File) => {
			try {
				if (!file) {
					throw new Error("No file selected");
				}

				if (!file.type.startsWith("image/")) {
					throw new Error("Selected file is not an image");
				}

				const reader = new FileReader();

				reader.onload = (e) => {
					if (!e.target?.result) {
						toast.error("Failed to load image");
						return;
					}

					const dataUrl = e.target.result as string;
					const img = new Image();

					img.onload = () => {
						// Store both the current image and original for reset functionality
						setImage(img);
						setOriginalImage(img);
						setIsUploadDialogOpen(false);
						toast.success("Image uploaded successfully");
					};

					img.onerror = () => {
						toast.error("Failed to load image");
					};

					img.src = dataUrl;
				};

				reader.onerror = () => {
					toast.error("Failed to read file");
				};

				reader.readAsDataURL(file);
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";

				toast.error(errorMessage);
			}
		},
		[setImage, setOriginalImage, setIsUploadDialogOpen]
	);

	return {
		handleImageUpload,
	};
};
