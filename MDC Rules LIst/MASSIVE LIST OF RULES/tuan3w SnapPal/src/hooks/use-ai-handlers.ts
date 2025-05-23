import { useDrawPilotStore } from "@/store";
import { toast } from "sonner";

// Helper function to convert blob URLs to data URLs
const blobToDataURL = async (blobUrl: string): Promise<string> => {
  // Fetch the blob from the URL
  const response = await fetch(blobUrl);
  const blob = await response.blob();

  // Use FileReader to convert the blob to a data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      resolve(base64data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const useAIHandlers = () => {
  const { setIsProcessingAI, setAiEditProgress } = useDrawPilotStore();

  const handleAIEditImage = async (
    imageUrl: string,
    selectedShapeIds: any,
    prompt = "Enhance and refine this selection"
  ) => {
    try {
      setIsProcessingAI(true);
      setAiEditProgress(0.1);

      // Convert blob URL to data URL if needed
      let dataUrl = imageUrl;
      if (imageUrl.startsWith("blob:")) {
        try {
          dataUrl = await blobToDataURL(imageUrl);
        } catch (error) {
          console.error("Error converting blob URL:", error);
          throw new Error("Failed to process image data");
        }
      }

      // Convert the imageUrl (data URL) to base64
      const base64Data = dataUrl.split(",")[1];
      if (!base64Data) {
        throw new Error("Failed to extract image data");
      }

      setAiEditProgress(0.3);

      // Call the API to process the image edit
      const response = await fetch("/api/ai/image-edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageData: base64Data,
          selection: selectedShapeIds,
          prompt,
        }),
      });

      setAiEditProgress(0.7);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();

      setAiEditProgress(0.9);

      if (!result.success || !result.editedImageData) {
        throw new Error(result.error || "Failed to edit image");
      }

      // Return the processed image data
      const resultImageUrl = `data:image/png;base64,${result.editedImageData}`;

      setAiEditProgress(1);

      // Complete the process
      setTimeout(() => {
        setIsProcessingAI(false);
        setAiEditProgress(0);
      }, 500);

      return resultImageUrl;
    } catch (error) {
      console.error("AI processing error:", error);
      toast.error("Failed to process image with AI");
      setIsProcessingAI(false);
      setAiEditProgress(0);
      return null;
    }
  };

  const handleAIPrompt = async (imageUrl: string, prompt: string) => {
    try {
      setIsProcessingAI(true);
      setAiEditProgress(0.1);

      // Convert blob URL to data URL if needed
      let dataUrl = imageUrl;
      if (imageUrl.startsWith("blob:")) {
        try {
          dataUrl = await blobToDataURL(imageUrl);
        } catch (error) {
          console.error("Error converting blob URL:", error);
          throw new Error("Failed to process image data");
        }
      }

      // Get base64 data from the image URL
      const base64Data = dataUrl.split(",")[1];

      // Log data for debugging

      if (!base64Data) {
        throw new Error("Failed to extract image data from URL");
      }

      setAiEditProgress(0.3);

      // Call the API to process the image with the prompt
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          drawingData: base64Data,
        }),
      });

      // Log the response status for debugging

      setAiEditProgress(0.7);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();

      setAiEditProgress(0.9);

      if (!result.success || !result.imageData) {
        throw new Error(result.error || "Failed to generate image");
      }

      // Return the processed image data
      const processedImageUrl = `data:image/png;base64,${result.imageData}`;

      setAiEditProgress(1);

      // Complete the process
      setTimeout(() => {
        setIsProcessingAI(false);
        setAiEditProgress(0);
      }, 500);

      return processedImageUrl;
    } catch (error) {
      console.error("AI prompt error:", error);
      toast.error("Failed to process image with AI");
      setIsProcessingAI(false);
      setAiEditProgress(0);
      return null;
    }
  };

  return {
    handleAIEditImage,
    handleAIPrompt,
  };
};
