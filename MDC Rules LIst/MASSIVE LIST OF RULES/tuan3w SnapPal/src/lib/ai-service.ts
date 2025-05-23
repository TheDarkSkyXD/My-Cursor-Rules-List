import type { SelectionData } from "@/components/canvas/object-selector";

interface ImageEditResponse {
	success: boolean;
	message: string;
	editedImageData: string;
	error?: string;
}

/**
 * Sends an image, selection area, and prompt to the AI service for editing
 *
 * @param imageData - Base64 encoded image data
 * @param selection - Area of the image to edit
 * @param prompt - User's instruction for how to edit the selection
 * @returns The response from the AI service, including the edited image
 */
export async function editImageWithAI(
	imageData: string,
	selection: SelectionData,
	prompt: string
): Promise<ImageEditResponse> {
	try {
		const response = await fetch("/api/ai/image-edit", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				imageData,
				selection,
				prompt,
			}),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.message || "Failed to edit image");
		}

		return await response.json();
	} catch (error) {
		console.error("Error editing image with AI:", error);
		return {
			success: false,
			message: error instanceof Error ? error.message : "Unknown error",
			editedImageData: imageData,
			error: "Failed to process the image edit",
		};
	}
}
