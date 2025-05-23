import { type SelectionData } from "@/components/canvas/object-selector";
import { useDrawPilotStore } from "@/store";
import type Konva from "konva";
import { useCallback } from "react";
import { toast } from "sonner";

// Mock AI service function that we'll implement later
const editImageWithAI = async (
  dataURL: string,
  selection: SelectionData,
  prompt: string
) => {
  // Simulate AI processing
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Return a successful response
  return {
    success: true,
    message: "Image edited successfully",
    editedImageData: dataURL, // In real implementation, this would be the edited image
  };
};

export const useAIHandlers = (
  stageRef: React.RefObject<Konva.Stage | null>
) => {
  const { image, setImage, setTool, setIsProcessingAI, setAiEditProgress } =
    useDrawPilotStore();

  const handleAIEditSelection = useCallback(
    async (selection: SelectionData, prompt = "Edit this area") => {
      if (!image || !stageRef.current) return;

      try {
        setIsProcessingAI(true);
        setAiEditProgress(10);

        // Progress simulation
        const progressInterval = setInterval(() => {
          setAiEditProgress((prev) => {
            // Cap at 90% until we get the actual result
            return prev < 90 ? prev + 10 : prev;
          });
        }, 200);

        // Capture the current stage as an image
        const dataURL = stageRef.current.toDataURL();

        // Call the AI service to edit the image
        const result = await editImageWithAI(dataURL, selection, prompt);

        clearInterval(progressInterval);
        setAiEditProgress(100);

        if (result.success) {
          // Load the edited image
          const newImg = new window.Image();
          newImg.onload = () => {
            setImage(newImg);
            setIsProcessingAI(false);
            toast.success(result.message);
            setAiEditProgress(0);
          };
          newImg.onerror = () => {
            console.error("Error loading edited image");
            setIsProcessingAI(false);
            toast.error("Failed to load the edited image");
            setAiEditProgress(0);
          };
          newImg.src = result.editedImageData;
        } else {
          toast.error(result.error || "Failed to edit the image");
          setIsProcessingAI(false);
          setAiEditProgress(0);
        }
      } catch (error) {
        console.error("Error editing image:", error);
        toast.error("An error occurred while editing the image");
        setIsProcessingAI(false);
        setAiEditProgress(0);
      }
    },
    [image, stageRef, setIsProcessingAI, setAiEditProgress, setImage]
  );

  const handleCancelAIEdit = useCallback(() => {
    // Set the tool back to select
    setTool("select");
  }, [setTool]);

  return {
    handleAIEditSelection,
    handleCancelAIEdit,
  };
};
