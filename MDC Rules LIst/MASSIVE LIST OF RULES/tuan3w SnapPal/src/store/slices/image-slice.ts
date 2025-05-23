import type { StateCreator } from "zustand";
import type { DrawPilotStore, ImageState } from "../types";

export const createImageSlice: StateCreator<DrawPilotStore, [], [], ImageState> = (set) => ({
	image: null,
	originalImage: null,
	imageFilter: {
		brightness: 0,
		contrast: 0,
		saturation: 0,
		blur: 0,
	},

	setImage: (image) => set({ image }),

	setOriginalImage: (originalImage) => set({ originalImage }),

	setImageFilter: (imageFilter) =>
		set((state) => ({
			imageFilter: typeof imageFilter === "function" ? imageFilter(state.imageFilter) : imageFilter,
		})),

	resetImage: () =>
		set((state) => ({
			image: state.originalImage,
			imageFilter: {
				brightness: 0,
				contrast: 0,
				saturation: 0,
				blur: 0,
			},
		})),

	changeFilter: (type, value) =>
		set((state) => ({
			imageFilter: {
				...state.imageFilter,
				[type]: value,
			},
		})),
});
