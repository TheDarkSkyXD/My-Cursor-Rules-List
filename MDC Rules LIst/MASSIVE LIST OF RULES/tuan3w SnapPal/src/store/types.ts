import type { BrushSizeType, ImageFilter } from "@/lib/constants";

export interface LineProps {
	points: number[];
	stroke: string;
	strokeWidth: number;
	id: string;
	tool?: string;
}

export interface ShapeProps {
	id: string;
	x: number;
	y: number;
	width?: number;
	height?: number;
	radius?: number;
	sides?: number;
	stroke: string;
	strokeWidth: number;
	fill?: string;
	type: "rectangle" | "circle" | "triangle" | "star";
	isDragging?: boolean;
}

export interface SelectionRectProps {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface StageSize {
	width: number;
	height: number;
}

export interface SelectionData {
	x: number;
	y: number;
	width: number;
	height: number;
	prompt: string;
}

// Store slice interfaces
export interface CanvasState {
	lines: LineProps[];
	shapes: ShapeProps[];
	stageSize: StageSize;
	hasDrawing: boolean;
	setLines: (lines: LineProps[] | ((prev: LineProps[]) => LineProps[])) => void;
	setShapes: (shapes: ShapeProps[] | ((prev: ShapeProps[]) => ShapeProps[])) => void;
	setStageSize: (size: StageSize) => void;
	clearCanvas: () => void;
}

export interface ToolState {
	tool: ToolType;
	brushColor: string;
	brushSize: BrushSizeType;
	isDrawing: boolean;
	setTool: (tool: ToolType) => void;
	setBrushColor: (color: string) => void;
	setBrushSize: (size: BrushSizeType) => void;
	setIsDrawing: (isDrawing: boolean) => void;
}

export interface SelectionState {
	selectedShapeId: string | null;
	selectedIds: string[];
	selectionRect: SelectionRectProps | null;
	selectedId: string | null;
	setSelectedShapeId: (id: string | null) => void;
	setSelectedIds: (ids: string[] | ((prev: string[]) => string[])) => void;
	setSelectionRect: (rect: SelectionRectProps | null) => void;
	setSelectedId: (id: string | null) => void;
	clearSelection: () => void;
}

export interface ImageState {
	image: HTMLImageElement | null;
	originalImage: HTMLImageElement | null;
	imageFilter: ImageFilter;
	setImage: (image: HTMLImageElement | null) => void;
	setOriginalImage: (image: HTMLImageElement | null) => void;
	setImageFilter: (filter: ImageFilter | ((prev: ImageFilter) => ImageFilter)) => void;
	resetImage: () => void;
	changeFilter: (type: keyof ImageFilter, value: number) => void;
}

export interface UIState {
	isColorPickerOpen: boolean;
	isFilterPanelOpen: boolean;
	isUploadDialogOpen: boolean;
	showKeyboardShortcuts: boolean;
	setIsColorPickerOpen: (isOpen: boolean) => void;
	setIsFilterPanelOpen: (isOpen: boolean) => void;
	setIsUploadDialogOpen: (isOpen: boolean) => void;
	setShowKeyboardShortcuts: (show: boolean) => void;
}

export interface AIState {
	isProcessingAI: boolean;
	aiEditProgress: number;
	setIsProcessingAI: (isProcessing: boolean) => void;
	setAiEditProgress: (progress: number) => void;
}

// Combined store type
export interface DrawPilotStore
	extends CanvasState,
		ToolState,
		SelectionState,
		ImageState,
		UIState,
		AIState {}
