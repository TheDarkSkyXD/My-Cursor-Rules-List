// Tool types
export type Tool =
  | "select"
  | "brush"
  | "eraser"
  | "rectangle"
  | "circle"
  | "triangle"
  | "star"
  | "ai-edit";

// Shape types
export type ShapeType = "rectangle" | "circle" | "triangle" | "star";

// Brush size types
export type BrushSizeType = "S" | "M" | "L" | "XL";

// Image filter interface
export interface ImageFilter {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
}

// Default values
export const DEFAULT_BRUSH_SIZE: BrushSizeType = "M";

export const DEFAULT_IMAGE_FILTER: ImageFilter = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  blur: 0,
};

// Brush size mapping
export const BRUSH_SIZES = {
  S: 5,
  M: 10,
  L: 20,
  XL: 30,
};

// Drawing colors
export const DRAWING_COLORS = [
  "#000000", // Black
  "#FFFFFF", // White
  "#F44336", // Red
  "#2196F3", // Blue
  "#4CAF50", // Green
  "#FFEB3B", // Yellow
  "#FF9800", // Orange
  "#9C27B0", // Purple
  "#795548", // Brown
  "#607D8B", // Gray Blue
];

// AI Edit presets
export const AI_EDIT_PRESETS = [
  "Enhance colors",
  "Make it realistic",
  "Convert to cartoon",
  "Add texture",
  "Make it abstract",
  "Add details",
  "Simplify",
  "Make it 3D",
  "Add shadows",
];

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  tools: {
    select: ["v", "1"],
    brush: ["b", "2"],
    eraser: ["e", "3"],
    rectangle: ["r", "4"],
    circle: ["c", "5"],
    triangle: ["t", "6"],
    star: ["s", "7"],
    aiEdit: ["a", "8"],
  },
  actions: {
    delete: ["Delete", "Backspace"],
    undo: ["Ctrl+Z", "⌘+Z"],
    redo: ["Ctrl+Shift+Z", "⌘+Shift+Z"],
    save: ["Ctrl+S", "⌘+S"],
    open: ["Ctrl+O", "⌘+O"],
    clearCanvas: ["Shift+X"],
    colorPicker: ["p"],
    filterPanel: ["f"],
    help: ["?"],
  },
};
