import type { StateCreator } from "zustand";
import type { CanvasState, DrawPilotStore } from "../types";

export const createCanvasSlice: StateCreator<DrawPilotStore, [], [], CanvasState> = (set) => ({
	lines: [],
	shapes: [],
	stageSize: { width: 800, height: 600 },
	hasDrawing: false,

	setLines: (lines) =>
		set((state) => ({
			lines: typeof lines === "function" ? lines(state.lines) : lines,
			hasDrawing:
				(typeof lines === "function" ? lines(state.lines) : lines).length > 0 ||
				state.shapes.length > 0,
		})),

	setShapes: (shapes) =>
		set((state) => ({
			shapes: typeof shapes === "function" ? shapes(state.shapes) : shapes,
			hasDrawing:
				state.lines.length > 0 ||
				(typeof shapes === "function" ? shapes(state.shapes) : shapes).length > 0,
		})),

	setStageSize: (stageSize) => set({ stageSize }),

	clearCanvas: () => set({ lines: [], shapes: [], hasDrawing: false }),
});
