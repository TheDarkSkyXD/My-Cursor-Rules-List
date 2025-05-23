import type { StateCreator } from "zustand";
import type { DrawPilotStore, SelectionState } from "../types";

export const createSelectionSlice: StateCreator<DrawPilotStore, [], [], SelectionState> = (
	set
) => ({
	selectedShapeId: null,
	selectedIds: [],
	selectionRect: null,
	selectedId: null,

	setSelectedShapeId: (selectedShapeId) => set({ selectedShapeId }),

	setSelectedIds: (selectedIds) =>
		set((state) => ({
			selectedIds: typeof selectedIds === "function" ? selectedIds(state.selectedIds) : selectedIds,
		})),

	setSelectionRect: (selectionRect) => set({ selectionRect }),

	setSelectedId: (selectedId) => set({ selectedId }),

	clearSelection: () => set({ selectedShapeId: null, selectedIds: [], selectedId: null }),
});
