import type { StateCreator } from "zustand";
import type { DrawPilotStore, UIState } from "../types";

export const createUISlice: StateCreator<DrawPilotStore, [], [], UIState> = (set) => ({
	isColorPickerOpen: false,
	isFilterPanelOpen: false,
	isUploadDialogOpen: false,
	showKeyboardShortcuts: false,

	setIsColorPickerOpen: (isColorPickerOpen) => set({ isColorPickerOpen }),
	setIsFilterPanelOpen: (isFilterPanelOpen) => set({ isFilterPanelOpen }),
	setIsUploadDialogOpen: (isUploadDialogOpen) => set({ isUploadDialogOpen }),
	setShowKeyboardShortcuts: (showKeyboardShortcuts) => set({ showKeyboardShortcuts }),
});
