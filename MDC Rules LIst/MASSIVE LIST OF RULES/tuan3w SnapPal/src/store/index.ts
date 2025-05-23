import {
  type BrushSizeType,
  DEFAULT_BRUSH_SIZE,
  DEFAULT_IMAGE_FILTER,
  DRAWING_COLORS,
  type ImageFilter,
  type Tool,
} from "@/lib/constants";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

// Types for our store
export interface Line {
  id: string;
  tool: "brush" | "eraser";
  points: number[];
  color: string;
  size: number;
}

export interface Shape {
  id: string;
  type: "rectangle" | "circle" | "triangle" | "star";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  isDrawing?: boolean;
}

export interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
}

export interface StageSize {
  width: number;
  height: number;
}

// Our store state interface
export interface DrawPilotStore {
  // Canvas state
  lines: Line[];
  shapes: Shape[];
  stageSize: StageSize;
  hasDrawing: boolean;

  // Drawing state
  isDrawing: boolean;
  currentLine: Line | null;

  // Tool state
  tool: Tool;
  brushColor: string;
  brushSize: BrushSizeType;

  // Selection state
  selectedShapeId: string | null;
  selectedIds: string[];
  selectionRect: SelectionRect | null;
  selectionStartPoint: { x: number; y: number } | null;

  // Image state
  image: HTMLImageElement | null;
  originalImage: HTMLImageElement | null;
  imageFilter: ImageFilter;

  // UI state
  isColorPickerOpen: boolean;
  isFilterPanelOpen: boolean;
  isUploadDialogOpen: boolean;
  showKeyboardShortcuts: boolean;

  // AI state
  isProcessingAI: boolean;
  aiEditProgress: number;

  // Canvas actions
  clearCanvas: () => void;
  setStageSize: (size: StageSize) => void;

  // Drawing actions
  setIsDrawing: (isDrawing: boolean) => void;
  updateCurrentLine: (line: Line) => void;
  addLine: (line: Line) => void;
  addShape: (shape: Shape) => void;
  updateShape: (shape: Shape) => void;

  // Tool actions
  setTool: (tool: Tool) => void;
  setBrushColor: (color: string) => void;
  setBrushSize: (size: BrushSizeType) => void;

  // Selection actions
  setSelectedShapeId: (id: string | null) => void;
  setSelectedIds: (ids: string[]) => void;
  clearSelection: () => void;
  startSelectionRect: (point: { x: number; y: number }) => void;
  updateSelectionRect: (point: { x: number; y: number }) => void;
  endSelectionRect: () => void;
  deleteSelectedShapes: () => void;
  deleteSelectedLines: () => void;
  selectShape: (id: string, addToExisting?: boolean) => void;

  // Image actions
  setImage: (image: HTMLImageElement | null) => void;
  setOriginalImage: (image: HTMLImageElement | null) => void;
  resetImage: () => void;
  changeFilter: (filter: Partial<ImageFilter>) => void;

  // UI actions
  setIsColorPickerOpen: (isOpen: boolean) => void;
  setIsFilterPanelOpen: (isOpen: boolean) => void;
  setIsUploadDialogOpen: (isOpen: boolean) => void;
  setShowKeyboardShortcuts: (show: boolean) => void;

  // AI actions
  setIsProcessingAI: (isProcessingAI: boolean) => void;
  setAiEditProgress: (aiEditProgress: number) => void;

  // New actions
  setSelectionRect: (rect: SelectionRect | null) => void;
}

// Create the store
export const useDrawPilotStore = create<DrawPilotStore>()(
  devtools(
    (set, get) => ({
      // Canvas state
      lines: [],
      shapes: [],
      stageSize: { width: 800, height: 600 },
      hasDrawing: false,

      // Drawing state
      isDrawing: false,
      currentLine: null,

      // Tool state
      tool: "select",
      brushColor: DRAWING_COLORS[0],
      brushSize: DEFAULT_BRUSH_SIZE,

      // Selection state
      selectedShapeId: null,
      selectedIds: [],
      selectionRect: null,
      selectionStartPoint: null,

      // Image state
      image: null,
      originalImage: null,
      imageFilter: DEFAULT_IMAGE_FILTER,

      // UI state
      isColorPickerOpen: false,
      isFilterPanelOpen: false,
      isUploadDialogOpen: false,
      showKeyboardShortcuts: false,

      // AI state
      isProcessingAI: false,
      aiEditProgress: 0,

      // Canvas actions
      clearCanvas: () => {
        set({
          lines: [],
          shapes: [],
          hasDrawing: false,
          selectedShapeId: null,
          selectedIds: [],
        });
      },

      setStageSize: (size) => set({ stageSize: size }),

      // Drawing actions
      setIsDrawing: (isDrawing) => set({ isDrawing }),

      updateCurrentLine: (line) => {
        // Only trigger state update if there's a meaningful change,
        // reducing unnecessary renders during drawing
        set((state) => ({
          currentLine: line,
          hasDrawing: true,
        }));
      },

      addLine: (line) => {
        console.log("Adding completed line with points:", line.points.length);

        // If line has too many points, simplify it before adding to state
        let pointsToStore = line.points;
        if (line.points.length > 100) {
          // Simple point reduction algorithm - keep every nth point
          // This drastically reduces stored points while maintaining shape
          const simplifiedPoints = [];
          const skipFactor = Math.floor(line.points.length / 50); // Aim for ~50 points

          for (let i = 0; i < line.points.length; i += 2) {
            if (
              i === 0 ||
              i >= line.points.length - 2 ||
              i % (skipFactor * 2) === 0
            ) {
              simplifiedPoints.push(line.points[i], line.points[i + 1]);
            }
          }

          pointsToStore = simplifiedPoints;
          console.log(
            "Simplified points from",
            line.points.length / 2,
            "to",
            simplifiedPoints.length / 2
          );
        }

        set((state) => ({
          lines: [...state.lines, { ...line, points: pointsToStore }],
          currentLine: null,
          hasDrawing: true,
        }));
      },

      addShape: (shape) => {
        console.log("Store: Adding shape", shape);
        set((state) => {
          const newShapes = [...state.shapes, shape];
          console.log("Store: Shapes after adding", newShapes);
          return {
            shapes: newShapes,
            hasDrawing: true,
          };
        });
      },

      updateShape: (updatedShape) => {
        console.log("Store: Updating shape", updatedShape);
        set((state) => {
          console.log("Shapes", state.shapes);
          const updatedShapes = state.shapes.map((shape) =>
            shape.id === updatedShape.id ? updatedShape : shape
          );
          console.log("Store: Shapes after update", updatedShapes);
          return {
            shapes: updatedShapes,
          };
        });
      },

      // Tool actions
      setTool: (tool) => set({ tool }),

      setBrushColor: (color) => set({ brushColor: color }),

      setBrushSize: (size) => set({ brushSize: size }),

      // Selection actions
      setSelectedShapeId: (id) => set({ selectedShapeId: id }),

      setSelectedIds: (ids) => set({ selectedIds: ids }),

      clearSelection: () => set({ selectedIds: [], selectedShapeId: null }),

      startSelectionRect: (point) => {
        set({
          selectionRect: {
            x: point.x,
            y: point.y,
            width: 0,
            height: 0,
            visible: true,
          },
          selectionStartPoint: point,
        });
      },

      updateSelectionRect: (point) => {
        const { selectionRect, selectionStartPoint } = get();
        if (!selectionRect || !selectionStartPoint) return;

        set({
          selectionRect: {
            x: Math.min(point.x, selectionStartPoint.x),
            y: Math.min(point.y, selectionStartPoint.y),
            width: Math.abs(point.x - selectionStartPoint.x),
            height: Math.abs(point.y - selectionStartPoint.y),
            visible: true,
          },
        });
      },

      endSelectionRect: () => {
        const { selectionRect, shapes, lines } = get();
        if (!selectionRect) return;

        // Select shapes within the rectangle
        const selectedShapeIds = shapes
          .filter((shape) => {
            // Simple intersection check
            return (
              shape.x < selectionRect.x + selectionRect.width &&
              shape.x + shape.width > selectionRect.x &&
              shape.y < selectionRect.y + selectionRect.height &&
              shape.y + shape.height > selectionRect.y
            );
          })
          .map((shape) => shape.id);

        // Select lines within the rectangle
        const selectedLineIds = lines
          .filter((line) => {
            // Check if any point of the line is within the selection rectangle
            for (let i = 0; i < line.points.length; i += 2) {
              const x = line.points[i];
              const y = line.points[i + 1];
              if (
                x >= selectionRect.x &&
                x <= selectionRect.x + selectionRect.width &&
                y >= selectionRect.y &&
                y <= selectionRect.y + selectionRect.height
              ) {
                return true;
              }
            }
            return false;
          })
          .map((line) => line.id);

        // Combine the selected shape and line IDs
        const selectedIds = [...selectedShapeIds, ...selectedLineIds];

        set({
          selectedIds,
          selectionRect: null,
          selectionStartPoint: null,
        });
      },

      deleteSelectedShapes: () => {
        set((state) => ({
          shapes: state.shapes.filter(
            (shape) => !state.selectedIds.includes(shape.id)
          ),
        }));
      },

      deleteSelectedLines: () => {
        set((state) => ({
          lines: state.lines.filter(
            (line) => !state.selectedIds.includes(line.id)
          ),
        }));
      },

      // Image actions
      setImage: (image) => set({ image }),

      setOriginalImage: (image) => set({ originalImage: image }),

      resetImage: () => {
        const { originalImage } = get();
        set({
          image: originalImage,
          imageFilter: DEFAULT_IMAGE_FILTER,
        });
      },

      changeFilter: (filter) => {
        set((state) => ({
          imageFilter: { ...state.imageFilter, ...filter },
        }));
      },

      // UI actions
      setIsColorPickerOpen: (isOpen) => set({ isColorPickerOpen: isOpen }),

      setIsFilterPanelOpen: (isOpen) => set({ isFilterPanelOpen: isOpen }),

      setIsUploadDialogOpen: (isOpen) => set({ isUploadDialogOpen: isOpen }),

      setShowKeyboardShortcuts: (show) => set({ showKeyboardShortcuts: show }),

      // AI actions
      setIsProcessingAI: (isProcessingAI: boolean) => set({ isProcessingAI }),

      setAiEditProgress: (aiEditProgress: number) => set({ aiEditProgress }),

      // New actions
      setSelectionRect: (rect) => set({ selectionRect: rect }),

      selectShape: (id, addToExisting = false) => {
        console.log("Store: selectShape called with:", { id, addToExisting });

        set((state) => {
          const newSelectedIds = addToExisting
            ? [...state.selectedIds, id]
            : [id];

          console.log("Store: updating selectedIds to:", newSelectedIds);

          return {
            selectedIds: newSelectedIds,
            selectedShapeId: id,
          };
        });
      },
    }),
    { name: "drawpilot-store" }
  )
);
