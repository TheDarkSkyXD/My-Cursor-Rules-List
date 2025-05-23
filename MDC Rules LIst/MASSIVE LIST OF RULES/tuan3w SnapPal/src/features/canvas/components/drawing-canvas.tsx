"use client";

import { TldrawEditor } from "@/components/tldraw-editor";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useAIHandlers } from "@/hooks/use-ai-handlers";
import { downloadFromDataUrl } from "@/lib/utils";
import { useDrawPilotStore } from "@/store";
import { AssetRecordType, Editor } from "@tldraw/tldraw";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// Helper to convert blob URL to data URL
const blobToDataURL = async (blobUrl: string): Promise<string> => {
	const response = await fetch(blobUrl);
	const blob = await response.blob();

	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(blob);
	});
};

// Helper to extract base64 data from a data URL
const getBase64FromDataURL = (dataUrl: string): string => {
	return dataUrl.split(",")[1];
};

const DrawingCanvas = () => {
	// Store state for AI integration
	const { isProcessingAI, aiEditProgress, setIsProcessingAI, setAiEditProgress } =
		useDrawPilotStore();

	// Editor reference for direct access
	const editorRef = useRef<Editor | null>(null);

	// Preview image in the modal
	const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

	// Command dialog state
	const [isCommandOpen, setIsCommandOpen] = useState(false);

	// Input ref for auto focus
	const inputRef = useRef<HTMLInputElement>(null);

	// Focus input when dialog opens
	useEffect(() => {
		if (isCommandOpen && inputRef.current) {
			// Short timeout to ensure DOM is ready
			setTimeout(() => {
				inputRef.current?.focus();
			}, 50);
		}
	}, [isCommandOpen]);

	// AI handlers
	const { handleAIPrompt } = useAIHandlers();

	// Clear the canvas
	const clearCanvas = useCallback(() => {
		if (!editorRef.current) return;

		const editor = editorRef.current;
		const shapeIds = [...editor.getCurrentPageShapeIds()];
		if (shapeIds.length > 0) {
			editor.deleteShapes(shapeIds);
		}
	}, []);

	// Handle image export (for download functionality)
	const handleImageExport = (imageUrl: string) => {
		downloadFromDataUrl(imageUrl, "drawpilot-canvas.png");
	};

	// Capture the current selection or entire canvas as an image
	const captureCanvasImage = useCallback(async (editor: Editor, selectedShapeIds?: string[]) => {
		try {
			// Defensive check - ensure editor is valid
			if (!editor) {
				throw new Error("Editor is not available");
			}

			// Validate selectedShapeIds to ensure they're all valid strings
			let shapesToCapture: string[] = [];

			if (selectedShapeIds?.length) {
				// Filter out any invalid IDs
				shapesToCapture = selectedShapeIds.filter((id) => id && typeof id === "string");

				// If we lost all valid IDs, default to capturing the whole canvas
				if (shapesToCapture.length === 0) {
					shapesToCapture = [...editor.getCurrentPageShapeIds()];
				}
			} else {
				shapesToCapture = [...editor.getCurrentPageShapeIds()];
			}

			// Ensure we have something to capture
			if (shapesToCapture.length === 0) {
				throw new Error("No shapes to capture");
			}

			// Use only standard options supported by Tldraw
			const result = await editor.toImage(shapesToCapture as any, {
				format: "png",
				background: true,
				scale: 2,
				padding: 0,
			});

			const imageUrl = URL.createObjectURL(result.blob);
			return imageUrl;
		} catch (error) {
			console.error("Error capturing canvas:", error);
			throw new Error("Failed to capture canvas");
		}
	}, []);

	// Create an image shape at the specified bounds
	const createImageShape = useCallback(
		(
			editor: Editor,
			imageUrl: string,
			shapeBounds?: { x: number; y: number; width: number; height: number }
		) => {
			try {
				// Create in center if no bounds provided
				let positionBounds = shapeBounds;
				if (!positionBounds) {
					const viewport = editor.getViewportScreenBounds();
					const img = new Image();
					img.src = imageUrl;

					// Use default dimensions if image isn't loaded yet
					const imgWidth = img.width || 500;
					const imgHeight = img.height || 400;

					positionBounds = {
						x: viewport.width / 2 - imgWidth / 2,
						y: viewport.height / 2 - imgHeight / 2,
						width: imgWidth,
						height: imgHeight,
					};
				}

				// Create asset
				const assetId = AssetRecordType.createId();
				editor.createAssets([
					{
						id: assetId,
						type: "image",
						typeName: "asset",
						props: {
							name: "ai-generated.png",
							src: imageUrl,
							w: positionBounds.width,
							h: positionBounds.height,
							mimeType: "image/png",
							isAnimated: false,
						},
						meta: {},
					},
				]);

				// Create shape
				editor.createShape({
					type: "image",
					props: {
						assetId,
						w: positionBounds.width,
						h: positionBounds.height,
					},
					x: positionBounds.x,
					y: positionBounds.y,
				});

				return true;
			} catch (error) {
				console.error("Error creating image shape:", error);
				return false;
			}
		},
		[]
	);

	// Generate image with AI
	const generateImageWithAI = useCallback(
		async (dataUrl: string, prompt: string): Promise<string | null> => {
			try {
				// First try direct API call
				try {
					const response = await fetch("/api/ai/generate", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							prompt,
							drawingData: getBase64FromDataURL(dataUrl),
						}),
					});

					const data = await response.json();
					if (response.ok && data.success && data.imageData) {
						return `data:image/png;base64,${data.imageData}`;
					}
				} catch (apiError) {
					console.error("Direct API call failed:", apiError);
				}

				// Fallback to hook method
				return await handleAIPrompt(dataUrl, prompt);
			} catch (error) {
				console.error("Error generating image with AI:", error);
				return null;
			}
		},
		[handleAIPrompt]
	);

	// Process image with AI and handle the result
	const processWithAI = useCallback(
		async ({
			editor,
			imageDataUrl,
			prompt,
			selectedIds,
			bounds,
		}: {
			editor: Editor;
			imageDataUrl: string;
			prompt: string;
			selectedIds?: string[];
			bounds?: { x: number; y: number; width: number; height: number };
		}) => {
			try {
				setIsProcessingAI(true);
				setAiEditProgress(0.1);

				// Generate the image
				setAiEditProgress(0.3);
				const generatedImageUrl = await generateImageWithAI(imageDataUrl, prompt);

				if (!generatedImageUrl) {
					toast.error("Failed to process image");
					setIsProcessingAI(false);
					return false;
				}

				// Show preview
				setPreviewImageUrl(generatedImageUrl);
				setAiEditProgress(0.8);

				// Wait for preview to be visible
				await new Promise((resolve) => setTimeout(resolve, 1500));

				// APPROACH CHANGE: Instead of trying complex selection and deletion,
				// we'll use a simpler strategy - clear everything we need before adding new content
				try {
					// If we have specific shapes to delete
					if (selectedIds?.length) {
						// Create a defensive copy and filter out any invalid IDs
						const validIds = [...selectedIds].filter((id) => id && typeof id === "string");

						if (validIds.length > 0) {
							try {
								// Delete the shapes directly without trying to select them first
								editor.deleteShapes(validIds as any);
							} catch (deleteError) {
								console.error("Error deleting specific shapes:", deleteError);
								// Fall back to clearing canvas if we can't delete specific shapes
								clearCanvas();
							}
						} else {
							// No valid IDs to delete, clear canvas
							clearCanvas();
						}
					} else {
						// No specific shapes to delete, clear canvas
						clearCanvas();
					}

					// Give a moment for the delete operation to complete
					await new Promise((resolve) => setTimeout(resolve, 100));
				} catch (error) {
					console.error("Error in deletion process:", error);
					// Last resort - try to clear canvas
					clearCanvas();
					await new Promise((resolve) => setTimeout(resolve, 100));
				}

				// Insert the new image
				try {
					if (bounds) {
						// Validate bounds before using them
						const validBounds = {
							x: Number.isFinite(bounds.x) ? bounds.x : 0,
							y: Number.isFinite(bounds.y) ? bounds.y : 0,
							width: Number.isFinite(bounds.width) && bounds.width > 0 ? bounds.width : 500,
							height: Number.isFinite(bounds.height) && bounds.height > 0 ? bounds.height : 500,
						};

						if (createImageShape(editor, generatedImageUrl, validBounds)) {
							toast.success("Image updated successfully!");
						} else {
							// Try again without bounds if it failed
							createImageShape(editor, generatedImageUrl);
						}
					} else {
						createImageShape(editor, generatedImageUrl);
					}
				} catch (createError) {
					console.error("Error creating image:", createError);
					// Try one more time with minimal parameters
					try {
						createImageShape(editor, generatedImageUrl);
					} catch (finalError) {
						toast.error("Failed to create image");
						setIsProcessingAI(false);
						return false;
					}
				}

				setAiEditProgress(1);

				// Reset state
				setTimeout(() => {
					setIsProcessingAI(false);
					setAiEditProgress(0);
					setPreviewImageUrl(null);
				}, 500);

				return true;
			} catch (error) {
				console.error("Error processing with AI:", error);
				toast.error("Something went wrong with the AI processing");
				setIsProcessingAI(false);
				return false;
			}
		},
		[generateImageWithAI, clearCanvas, createImageShape, setIsProcessingAI, setAiEditProgress]
	);

	// Handle AI requests from tldraw
	const handleAIRequest = async (imageUrl: string, selectedShapeIds: string[]) => {
		if (!selectedShapeIds?.length) {
			toast.error("Please select shapes to edit with AI");
			return;
		}

		const editor = editorRef.current;
		if (!editor) return;

		try {
			// Find colliding shapes by checking intersections directly - this avoids complex typing issues
			const allShapeIds = [...editor.getCurrentPageShapeIds()];
			const collisionMap = new Map<string, boolean>();

			// Start with the selected shapes - ensure they're valid
			const validSelectedIds = selectedShapeIds.filter((id) => id && typeof id === "string");
			if (validSelectedIds.length === 0) {
				toast.error("Invalid selection detected");
				return;
			}

			const expandedSelection = [...validSelectedIds];

			// Mark selected shapes as processed
			for (const id of validSelectedIds) {
				collisionMap.set(id, true);
			}

			// For each selected shape, find other shapes that collide with it
			for (const selectedId of validSelectedIds) {
				try {
					// Get bounds safely
					const selectedBounds = editor.getShapePageBounds(selectedId as any);
					if (!selectedBounds) continue;

					// Check collision with all other shapes
					for (const shapeId of allShapeIds) {
						// Skip already processed shapes
						if (collisionMap.has(shapeId)) continue;

						try {
							const shapeBounds = editor.getShapePageBounds(shapeId);
							if (!shapeBounds) continue;

							// Check for collision using bounding box intersection
							const collision = !(
								selectedBounds.maxX < shapeBounds.minX ||
								selectedBounds.minX > shapeBounds.maxX ||
								selectedBounds.maxY < shapeBounds.minY ||
								selectedBounds.minY > shapeBounds.maxY
							);

							if (collision) {
								expandedSelection.push(shapeId);
								collisionMap.set(shapeId, true);
							}
						} catch (error) {
							console.error("Error checking shape collision:", error);
							// Continue with next shape
						}
					}
				} catch (error) {
					console.error("Error processing selected shape:", error);
					// Continue with next selected shape
				}
			}

			// Determine shapes to process - either expanded or original
			const shapesToProcess =
				expandedSelection.length > validSelectedIds.length ? expandedSelection : validSelectedIds;

			// Get the bounds for the shapes
			let shapeBounds = undefined;
			try {
				// Instead of relying on editor selection, calculate bounds directly from our shapes
				// For simplicity, we'll use the selection bounds as an approximation
				const selectionBounds = editor.getSelectionPageBounds();
				if (selectionBounds) {
					shapeBounds = {
						x: selectionBounds.x,
						y: selectionBounds.y,
						width: selectionBounds.width,
						height: selectionBounds.height,
					};
				}
			} catch (boundsError) {
				console.error("Error getting shape bounds:", boundsError);
				// Continue without bounds
			}

			// Prompt the user for instructions
			const userPrompt = prompt(
				"What would you like to do with this selection?",
				"Enhance and refine this selection"
			);

			if (!userPrompt) return; // User cancelled the prompt

			// Convert blob URL to data URL if needed
			const dataUrl = imageUrl.startsWith("blob:") ? await blobToDataURL(imageUrl) : imageUrl;

			// Process with AI
			await processWithAI({
				editor,
				imageDataUrl: dataUrl,
				prompt: userPrompt,
				selectedIds: shapesToProcess,
				bounds: shapeBounds,
			});
		} catch (error) {
			console.error("Error in AI request:", error);
			toast.error("Something went wrong with the AI request");
		}
	};

	// Handle editor mount to access it directly
	const handleEditorMount = (editor: Editor) => {
		editorRef.current = editor;
	};

	// Add a useEffect to handle collision-based selection
	useEffect(() => {
		const editor = editorRef.current;
		if (!editor) return;

		// Function to select shapes that collide with the current selection
		const handleSelectionChange = () => {
			// Skip if AI is processing or if no editor
			if (isProcessingAI) return;

			const selectedIds = editor.getSelectedShapeIds();

			// Only handle the case where exactly one shape is selected
			// This prevents recursion and focuses on the initial selection case
			if (selectedIds.length !== 1) return;

			// Get all shapes on the current page
			const allShapeIds = editor.getCurrentPageShapeIds();

			// Get the bounds of the selected shape
			const selectedShapeBounds = editor.getShapePageBounds(selectedIds[0]);
			if (!selectedShapeBounds) return;

			// Find shapes that collide with the selected shape
			const collidingShapeIds = [];

			for (const shapeId of allShapeIds) {
				// Skip the selected shape itself
				if (shapeId === selectedIds[0]) continue;

				const shapeBounds = editor.getShapePageBounds(shapeId);
				if (!shapeBounds) continue;

				// Check if bounds intersect/collide using simple box intersection
				if (
					!(
						selectedShapeBounds.maxX < shapeBounds.minX ||
						selectedShapeBounds.minX > shapeBounds.maxX ||
						selectedShapeBounds.maxY < shapeBounds.minY ||
						selectedShapeBounds.minY > shapeBounds.maxY
					)
				) {
					collidingShapeIds.push(shapeId);
				}
			}

			// If we found colliding shapes, add them to the selection
			if (collidingShapeIds.length > 0) {
				const newSelection = [...selectedIds, ...collidingShapeIds];

				// Update selection to include colliding shapes
				// Need to use as any because TypeScript doesn't know about the editor.setSelectedIds method
				(editor as any).setSelectedIds?.(newSelection);
			}
		};

		// Set up a listener for selection changes
		const unsubscribe = editor.store.listen(
			// The callback will run after any change to the store
			() => {
				const selectedIds = editor.getSelectedShapeIds();
				// We track selection length to detect changes
				if (selectedIds.length === 1) {
					handleSelectionChange();
				}
			}
		);

		// Clean up when component unmounts
		return () => {
			unsubscribe();
		};
	}, [isProcessingAI]);

	// Handle prompt submission
	const handlePromptSubmit = useCallback(
		async (prompt: string) => {
			try {
				setIsCommandOpen(false);

				const editor = editorRef.current;
				if (!editor) return;

				// Get selection info
				const originalShapeIds = [...editor.getSelectedShapeIds()];
				const hasSelection = originalShapeIds.length > 0;

				// If nothing is selected, show a notification and exit
				if (!hasSelection) {
					toast.error("Please select shapes to edit with AI");
					return;
				}

				let shapesToProcess = originalShapeIds;

				// Look for colliding shapes
				try {
					// Find colliding shapes using the same logic as in handleAIRequest
					const allShapeIds = [...editor.getCurrentPageShapeIds()];
					const collisionMap = new Map<string, boolean>();

					// Start with the selected shapes
					const expandedSelection = [...originalShapeIds];

					// Mark selected shapes as processed
					for (const id of originalShapeIds) {
						collisionMap.set(id, true);
					}

					// For each selected shape, find other shapes that collide with it
					for (const selectedId of originalShapeIds) {
						// Use type assertion as we know these are valid shape IDs
						const selectedBounds = editor.getShapePageBounds(selectedId as any);
						if (!selectedBounds) continue;

						// Check collision with all other shapes
						for (const shapeId of allShapeIds) {
							// Skip already processed shapes
							if (collisionMap.has(shapeId)) continue;

							const shapeBounds = editor.getShapePageBounds(shapeId);
							if (!shapeBounds) continue;

							// Check for collision using bounding box intersection
							const collision = !(
								selectedBounds.maxX < shapeBounds.minX ||
								selectedBounds.minX > shapeBounds.maxX ||
								selectedBounds.maxY < shapeBounds.minY ||
								selectedBounds.minY > shapeBounds.maxY
							);

							if (collision) {
								expandedSelection.push(shapeId);
								collisionMap.set(shapeId, true);
							}
						}
					}

					// If we found colliding shapes, update the selection
					if (expandedSelection.length > originalShapeIds.length) {
						try {
							// Filter out any invalid IDs
							const safeExpandedSelection = expandedSelection.filter(
								(id) => id && typeof id === "string"
							);

							if (safeExpandedSelection.length > 0) {
								// Don't modify the editor's selection - just use the expanded selection for processing
								console.log(
									`Found ${safeExpandedSelection.length - originalShapeIds.length} additional related shapes to process`
								);

								// Use our safe expanded selection directly
								shapesToProcess = safeExpandedSelection;
							} else {
								// If we lost all valid IDs, fall back to original selection
								shapesToProcess = originalShapeIds;
							}
						} catch (err) {
							console.error("Error processing expanded selection:", err);
							// If there's any error, fall back to the original selection
							shapesToProcess = originalShapeIds;
						}
					}
				} catch (err) {
					console.error("Error finding colliding shapes:", err);
				}

				// Get bounds for the selection
				let shapeBounds: { x: number; y: number; width: number; height: number } | undefined =
					undefined;

				const selectionBounds = editor.getSelectionPageBounds();
				if (selectionBounds) {
					shapeBounds = {
						x: selectionBounds.x,
						y: selectionBounds.y,
						width: selectionBounds.width,
						height: selectionBounds.height,
					};
				}

				// Capture only the selected shapes for AI processing
				const canvasImageUrl = await captureCanvasImage(editor, shapesToProcess);

				// Convert blob URL to data URL
				const dataUrl = await blobToDataURL(canvasImageUrl);

				// Process with AI
				await processWithAI({
					editor,
					imageDataUrl: dataUrl,
					prompt,
					selectedIds: shapesToProcess,
					bounds: shapeBounds,
				});
			} catch (error) {
				console.error("Error processing prompt:", error);
				toast.error("Failed to process prompt");
			}
		},
		[captureCanvasImage, processWithAI]
	);

	// Set up keyboard shortcut for command palette
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Check for Command+K (Mac) or Ctrl+K (Windows/Linux)
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				e.preventDefault();
				setIsCommandOpen(true);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	return (
		<div className="canvas-container flex flex-col h-full">
			<div className="flex-1 relative">
				<TldrawEditor
					onImageExport={handleImageExport}
					onAIRequest={handleAIRequest}
					generatedImageUrl={previewImageUrl}
					onEditorMount={handleEditorMount}
				/>

				{/* Command Dialog for AI prompts */}
				<Dialog open={isCommandOpen} onOpenChange={setIsCommandOpen}>
					<DialogContent className="bg-white p-0 overflow-hidden max-w-md border-none rounded-2xl shadow-lg">
						<Command className="rounded-xl border-0 shadow-none bg-transparent">
							<div className="px-4 py-3 bg-blue-50 rounded-none mb-2">
								<CommandInput
									ref={inputRef}
									placeholder="What would you like to create? ✨"
									autoFocus
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											e.preventDefault();
											const prompt = e.currentTarget.value;
											if (prompt.trim()) {
												handlePromptSubmit(prompt);
												setIsCommandOpen(false);
											}
										}
									}}
									className="text-base py-2 font-medium text-blue-700 bg-transparent border-none focus:ring-0 placeholder:text-blue-400"
								/>
							</div>
							<CommandList className="px-2 max-h-[400px]">
								<CommandEmpty className="py-6 text-center text-base text-blue-500">
									<div className="flex flex-col items-center gap-2">
										<span className="text-3xl">✨</span>
										<span>Type a prompt or select an option below</span>
									</div>
								</CommandEmpty>

								<CommandGroup
									heading="✨ Fun Style Magic"
									className="font-medium text-sm text-purple-600 mb-2"
								>
									<CommandItem
										onSelect={() => handlePromptSubmit("Convert to watercolor painting style")}
										className="mb-1 rounded-lg p-2 hover:bg-purple-50 transition-colors"
									>
										<div className="flex items-center">
											<div className="text-lg mr-3 bg-purple-100 p-1.5 rounded-full flex items-center justify-center w-8 h-8">
												🎨
											</div>
											<span className="text-purple-700">Splash some watercolor</span>
										</div>
									</CommandItem>
									<CommandItem
										onSelect={() => handlePromptSubmit("Make it look like an oil painting")}
										className="mb-1 rounded-lg p-2 hover:bg-purple-50 transition-colors"
									>
										<div className="flex items-center">
											<div className="text-lg mr-3 bg-purple-100 p-1.5 rounded-full flex items-center justify-center w-8 h-8">
												🖼️
											</div>
											<span className="text-purple-700">Classic oil painting vibes</span>
										</div>
									</CommandItem>
									<CommandItem
										onSelect={() => handlePromptSubmit("Convert to a sketch")}
										className="mb-1 rounded-lg p-2 hover:bg-purple-50 transition-colors"
									>
										<div className="flex items-center">
											<div className="text-lg mr-3 bg-purple-100 p-1.5 rounded-full flex items-center justify-center w-8 h-8">
												✏️
											</div>
											<span className="text-purple-700">Sketch it out</span>
										</div>
									</CommandItem>
									<CommandItem
										onSelect={() => handlePromptSubmit("Make it pixel art style")}
										className="mb-1 rounded-lg p-2 hover:bg-purple-50 transition-colors"
									>
										<div className="flex items-center">
											<div className="text-lg mr-3 bg-purple-100 p-1.5 rounded-full flex items-center justify-center w-8 h-8">
												👾
											</div>
											<span className="text-purple-700">Retro pixel fun</span>
										</div>
									</CommandItem>
								</CommandGroup>

								<Separator className="my-2 bg-gray-100" />
								<CommandGroup
									heading="🌈 Color Play"
									className="font-medium text-sm text-pink-600 mb-2"
								>
									<CommandItem
										onSelect={() => handlePromptSubmit("Make it more colorful and vibrant")}
										className="mb-1 rounded-lg p-2 hover:bg-pink-50 transition-colors"
									>
										<div className="flex items-center">
											<div className="text-lg mr-3 bg-pink-100 p-1.5 rounded-full flex items-center justify-center w-8 h-8">
												🌈
											</div>
											<span className="text-pink-700">Super vibrant colors</span>
										</div>
									</CommandItem>
									<CommandItem
										onSelect={() => handlePromptSubmit("Convert to black and white")}
										className="mb-1 rounded-lg p-2 hover:bg-pink-50 transition-colors"
									>
										<div className="flex items-center">
											<div className="text-lg mr-3 bg-pink-100 p-1.5 rounded-full flex items-center justify-center w-8 h-8">
												🖤
											</div>
											<span className="text-pink-700">Classic B&W mood</span>
										</div>
									</CommandItem>
									<CommandItem
										onSelect={() => handlePromptSubmit("Apply sepia tone filter")}
										className="mb-1 rounded-lg p-2 hover:bg-pink-50 transition-colors"
									>
										<div className="flex items-center">
											<div className="text-lg mr-3 bg-pink-100 p-1.5 rounded-full flex items-center justify-center w-8 h-8">
												🏆
											</div>
											<span className="text-pink-700">Vintage sepia feels</span>
										</div>
									</CommandItem>
									<CommandItem
										onSelect={() => handlePromptSubmit("Use neon colors")}
										className="mb-1 rounded-lg p-2 hover:bg-pink-50 transition-colors"
									>
										<div className="flex items-center">
											<div className="text-lg mr-3 bg-pink-100 p-1.5 rounded-full flex items-center justify-center w-8 h-8">
												💫
											</div>
											<span className="text-pink-700">Glow with neon pop</span>
										</div>
									</CommandItem>
								</CommandGroup>

								<Separator className="my-2 bg-gray-100" />
								<CommandGroup
									heading="🏞️ Scene Boosters"
									className="font-medium text-sm text-teal-600 mb-2"
								>
									<CommandItem
										onSelect={() => handlePromptSubmit("Change to night time")}
										className="mb-1 rounded-lg p-2 hover:bg-teal-50 transition-colors"
									>
										<div className="flex items-center">
											<div className="text-lg mr-3 bg-teal-100 p-1.5 rounded-full flex items-center justify-center w-8 h-8">
												🌙
											</div>
											<span className="text-teal-700">Nighttime magic</span>
										</div>
									</CommandItem>
									<CommandItem
										onSelect={() => handlePromptSubmit("Add trees in the background")}
										className="mb-1 rounded-lg p-2 hover:bg-teal-50 transition-colors"
									>
										<div className="flex items-center">
											<div className="text-lg mr-3 bg-teal-100 p-1.5 rounded-full flex items-center justify-center w-8 h-8">
												🌳
											</div>
											<span className="text-teal-700">Add some trees</span>
										</div>
									</CommandItem>
									<CommandItem
										onSelect={() => handlePromptSubmit("Make it look like it's raining")}
										className="mb-1 rounded-lg p-2 hover:bg-teal-50 transition-colors"
									>
										<div className="flex items-center">
											<div className="text-lg mr-3 bg-teal-100 p-1.5 rounded-full flex items-center justify-center w-8 h-8">
												🌧️
											</div>
											<span className="text-teal-700">Make it rainy day</span>
										</div>
									</CommandItem>
									<CommandItem
										onSelect={() => handlePromptSubmit("Add fluffy clouds in the sky")}
										className="mb-1 rounded-lg p-2 hover:bg-teal-50 transition-colors"
									>
										<div className="flex items-center">
											<div className="text-lg mr-3 bg-teal-100 p-1.5 rounded-full flex items-center justify-center w-8 h-8">
												☁️
											</div>
											<span className="text-teal-700">Add fluffy clouds</span>
										</div>
									</CommandItem>
								</CommandGroup>

								<Separator className="my-2 bg-gray-100" />
								<CommandGroup
									heading="✨ Artistic Flair"
									className="font-medium text-sm text-amber-600 mb-2"
								>
									<CommandItem
										onSelect={() => handlePromptSubmit("Make it look like a comic book")}
										className="mb-1 rounded-lg p-2 hover:bg-amber-50 transition-colors"
									>
										<div className="flex items-center">
											<div className="text-lg mr-3 bg-amber-100 p-1.5 rounded-full flex items-center justify-center w-8 h-8">
												💥
											</div>
											<span className="text-amber-700">Comic book pow!</span>
										</div>
									</CommandItem>
									<CommandItem
										onSelect={() => handlePromptSubmit("Add a dreamy, ethereal quality")}
										className="mb-1 rounded-lg p-2 hover:bg-amber-50 transition-colors"
									>
										<div className="flex items-center">
											<div className="text-lg mr-3 bg-amber-100 p-1.5 rounded-full flex items-center justify-center w-8 h-8">
												💫
											</div>
											<span className="text-amber-700">Dreamy wonderland</span>
										</div>
									</CommandItem>
									<CommandItem
										onSelect={() => handlePromptSubmit("Make it look like a mosaic")}
										className="mb-1 rounded-lg p-2 hover:bg-amber-50 transition-colors"
									>
										<div className="flex items-center">
											<div className="text-lg mr-3 bg-amber-100 p-1.5 rounded-full flex items-center justify-center w-8 h-8">
												🧩
											</div>
											<span className="text-amber-700">Mosaic puzzle magic</span>
										</div>
									</CommandItem>
									<CommandItem
										onSelect={() => handlePromptSubmit("Add a vignette effect")}
										className="mb-1 rounded-lg p-2 hover:bg-amber-50 transition-colors"
									>
										<div className="flex items-center">
											<div className="text-lg mr-3 bg-amber-100 p-1.5 rounded-full flex items-center justify-center w-8 h-8">
												🔍
											</div>
											<span className="text-amber-700">Focus with vignette</span>
										</div>
									</CommandItem>
								</CommandGroup>
							</CommandList>
						</Command>
					</DialogContent>
				</Dialog>
			</div>

			{/* AI processing overlay */}
			{isProcessingAI && (
				<div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm z-[1000]">
					<div className="bg-gradient-to-br from-white to-blue-50 p-8 rounded-3xl shadow-2xl flex flex-col items-center w-[380px] border border-blue-100">
						<div className="bg-gradient-to-br from-blue-200 to-indigo-100 w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-inner">
							<Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
						</div>
						<p className="text-2xl font-fredoka text-indigo-700 mb-3">Creating magic... ✨</p>
						<p className="text-sm font-quicksand text-indigo-500 mb-4">
							Your creation is being crafted
						</p>
						<div className="w-full bg-blue-100 rounded-full h-4 mt-1 mb-6 overflow-hidden">
							<div
								className="bg-gradient-to-r from-blue-500 to-indigo-500 h-4 rounded-full transition-all duration-300"
								style={{ width: `${aiEditProgress * 100}%` }}
							></div>
						</div>

						{previewImageUrl && (
							<div className="mt-4 w-full bg-white p-4 rounded-2xl border border-blue-100 shadow-sm">
								<p className="text-base font-fredoka text-indigo-600 mb-3">
									✨ Preview of your creation:
								</p>
								<img
									src={previewImageUrl}
									alt="AI Generated Preview"
									className="w-full h-auto rounded-xl border border-indigo-100 shadow-sm"
								/>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
};

export default DrawingCanvas;
