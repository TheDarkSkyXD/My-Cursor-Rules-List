import { useEffect } from "react";
import { useDrawPilotStore } from "@/store";
import { Tool } from "@/lib/constants";

export const useKeyboardShortcuts = (
	handleDeleteSelected: () => void,
	handleClearCanvas: () => void,
	handleDownload: () => void
) => {
	const {
		setTool,
		tool,
		image,
		setIsColorPickerOpen,
		setIsFilterPanelOpen,
		setShowKeyboardShortcuts,
		clearSelection,
	} = useDrawPilotStore();

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Don't handle keyboard events if user is typing in an input
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement ||
				e.target instanceof HTMLSelectElement
			) {
				return;
			}

			// Don't handle events with meta (Command) or control pressed, except specified combinations
			const isMetaOrCtrl = e.metaKey || e.ctrlKey;

			// Tool selection shortcuts
			const handleToolSelection = () => {
				// Number keys 1-8 or specific letters
				switch (e.key) {
					case "1":
					case "v":
					case "V":
						setTool("select");
						break;
					case "2":
					case "b":
					case "B":
						setTool("brush");
						break;
					case "3":
					case "e":
					case "E":
						setTool("eraser");
						break;
					case "4":
					case "r":
					case "R":
						setTool("rectangle");
						break;
					case "5":
					case "c":
					case "C":
						setTool("circle");
						break;
					case "6":
					case "t":
					case "T":
						setTool("triangle");
						break;
					case "7":
					case "s":
					case "S":
						setTool("star");
						break;
					case "8":
					case "a":
					case "A":
						// Only set AI edit tool if there's an image to edit
						if (image) {
							setTool("ai-edit");
						}
						break;
				}
			};

			// First handle any Meta/Ctrl combinations
			if (isMetaOrCtrl) {
				switch (e.key.toLowerCase()) {
					case "a": // Select all - not implemented yet
						e.preventDefault();
						// selectAll(); - would need to implement in store
						break;
					case "s": // Save
						e.preventDefault();
						handleDownload();
						break;
					case "o": // Open - show upload dialog
						e.preventDefault();
						// toggleUploadDialog(); - would need to pass this in
						break;
					case "z": // Undo
						if (e.shiftKey) {
							e.preventDefault();
							// redo(); - would need to implement in store
						} else {
							e.preventDefault();
							// undo(); - would need to implement in store
						}
						break;
					default:
						break;
				}
				return;
			}

			// Then handle regular keyboard shortcuts
			switch (e.key) {
				case "Escape":
					// Cancel current tool or selection
					if (tool !== "select") {
						setTool("select");
					} else {
						clearSelection();
					}
					break;

				case "Delete":
				case "Backspace":
					// Delete selected shapes/lines
					handleDeleteSelected();
					break;

				case "p":
				case "P":
					// Toggle color picker
					setIsColorPickerOpen((prev) => !prev);
					setIsFilterPanelOpen(false);
					break;

				case "f":
				case "F":
					// Toggle filter panel
					if (image) {
						setIsFilterPanelOpen((prev) => !prev);
						setIsColorPickerOpen(false);
					}
					break;

				case "?":
					// Show keyboard shortcuts
					setShowKeyboardShortcuts(true);
					break;

				case "x":
				case "X":
					// Clear canvas with Shift+X
					if (e.shiftKey) {
						handleClearCanvas();
					}
					break;

				default:
					// If no special key, check for tool selection
					handleToolSelection();
					break;
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [
		setTool,
		tool,
		image,
		clearSelection,
		handleDeleteSelected,
		handleClearCanvas,
		handleDownload,
		setIsColorPickerOpen,
		setIsFilterPanelOpen,
		setShowKeyboardShortcuts,
	]);
};
