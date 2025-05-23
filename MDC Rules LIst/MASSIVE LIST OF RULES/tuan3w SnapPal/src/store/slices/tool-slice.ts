import type { StateCreator } from "zustand";
import type { DrawPilotStore, ToolState } from "../types";

export const createToolSlice: StateCreator<DrawPilotStore, [], [], ToolState> = (set) => ({
	tool: "select",
	brushColor: "#000000",
	brushSize: "M",
	isDrawing: false,

	setTool: (tool) => set({ tool }),
	setBrushColor: (brushColor) => set({ brushColor }),
	setBrushSize: (brushSize) => set({ brushSize }),
	setIsDrawing: (isDrawing) => set({ isDrawing }),
});
