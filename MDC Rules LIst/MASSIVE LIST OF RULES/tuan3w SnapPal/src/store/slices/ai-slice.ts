import type { StateCreator } from "zustand";
import type { DrawPilotStore, AIState } from "../types";

export const createAISlice: StateCreator<DrawPilotStore, [], [], AIState> = (set) => ({
	isProcessingAI: false,
	aiEditProgress: 0,

	setIsProcessingAI: (isProcessingAI) => set({ isProcessingAI }),
	setAiEditProgress: (aiEditProgress) => set({ aiEditProgress }),
});
