import { BRUSH_SIZES, type ShapeType } from "@/lib/constants";
import { generateId } from "@/lib/utils";
import { useDrawPilotStore } from "@/store";
import type Konva from "konva";
import { KonvaEventObject } from "konva/lib/Node";
import { useCallback } from "react";

export const useCanvasHandlers = () => {
  const {
    tool,
    lines,
    shapes,
    brushColor,
    brushSize,
    isDrawing,
    currentLine,
    addLine,
    updateCurrentLine,
    setIsDrawing,
    addShape,
    updateShape,
    selectedIds,
    setSelectedIds,
    clearSelection,
    startSelectionRect,
    updateSelectionRect,
    endSelectionRect,
    deleteSelectedShapes,
    deleteSelectedLines,
  } = useDrawPilotStore();

  const handleMouseDown = useCallback(
    (
      e: KonvaEventObject<MouseEvent | TouchEvent>,
      layerRef: React.RefObject<Konva.Layer>,
      startPos?: { x: number; y: number } | null,
      targetId?: string | null
    ) => {
      // Get position from event
      const pos = startPos ||
        e.target.getStage()?.getPointerPosition() || { x: 0, y: 0 };

      if (tool === "select") {
        // Handle selection
        const clickedOnEmpty = e.target === e.target.getStage();
        const target = e.target;
        const targetIsShape = target.hasName("shape");
        const targetIsLine = target.hasName("line");

        // If clicked on empty area without shift - clear selection
        if (clickedOnEmpty && !e.evt.shiftKey) {
          clearSelection();

          // Start selection rect
          startSelectionRect(pos);
          return;
        }

        // If clicked on a shape or line with shift - toggle selection
        if ((targetIsShape || targetIsLine) && e.evt.shiftKey) {
          const id = target.id();

          if (selectedIds.includes(id)) {
            setSelectedIds(
              selectedIds.filter((selectedId) => selectedId !== id)
            );
          } else {
            setSelectedIds([...selectedIds, id]);
          }
          return;
        }

        // If clicked on a shape or line without shift - select only this shape
        if ((targetIsShape || targetIsLine) && !e.evt.shiftKey) {
          const id = target.id();
          setSelectedIds([id]);
          return;
        }
      }

      if (tool === "brush") {
        setIsDrawing(true);
        updateCurrentLine({
          tool: "brush",
          points: [pos.x, pos.y],
          color: brushColor,
          size: BRUSH_SIZES[brushSize],
          id: generateId("brush"),
        });
      }

      if (tool === "eraser") {
        setIsDrawing(true);
        updateCurrentLine({
          tool: "eraser",
          points: [pos.x, pos.y],
          color: "white",
          size: BRUSH_SIZES[brushSize],
          id: generateId("eraser"),
        });
      }

      if (["rectangle", "circle", "triangle", "star"].includes(tool)) {
        // Create a new shape at this position
        const shapeType = tool as ShapeType;
        const id = targetId || generateId(shapeType);

        // Simply use the pointer position for shape creation
        addShape({
          id,
          type: shapeType,
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0,
          color: brushColor,
          isDrawing: true,
        });
      }
    },
    [
      tool,
      brushColor,
      brushSize,
      selectedIds,
      setSelectedIds,
      clearSelection,
      startSelectionRect,
      setIsDrawing,
      updateCurrentLine,
      addShape,
    ]
  );

  const handleMouseMove = useCallback(
    (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
      const stage = e.target.getStage();
      if (!stage) return;

      const pos = stage.getPointerPosition();
      if (!pos) return;

      if (tool === "select" && e.target === stage) {
        // Update selection rect
        updateSelectionRect(pos);
        return;
      }

      if ((tool === "brush" || tool === "eraser") && isDrawing && currentLine) {
        // Add points to the line - limit point capture rate for better performance
        // Only add a point if it's sufficiently far from the last point
        const lastX = currentLine.points[currentLine.points.length - 2] || 0;
        const lastY = currentLine.points[currentLine.points.length - 1] || 0;

        // Calculate distance between last point and current point
        const dx = pos.x - lastX;
        const dy = pos.y - lastY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Only add points if distance is significant (reduces number of points)
        if (distance > 2) {
          const newPoints = [...currentLine.points, pos.x, pos.y];
          updateCurrentLine({ ...currentLine, points: newPoints });
        }
      }

      if (["rectangle", "circle", "triangle", "star"].includes(tool)) {
        // Find the shape that's currently being drawn
        const drawingShape = shapes.find((shape) => shape.isDrawing);

        if (drawingShape) {
          // Update its size based on the current position
          const width = pos.x - drawingShape.x;
          const height = pos.y - drawingShape.y;

          updateShape({
            ...drawingShape,
            width,
            height,
          });
        }
      }
    },
    [
      tool,
      isDrawing,
      currentLine,
      shapes,
      updateSelectionRect,
      updateCurrentLine,
      updateShape,
    ]
  );

  const handleMouseUp = useCallback(
    (
      e: KonvaEventObject<MouseEvent | TouchEvent>,
      layerRef: React.RefObject<Konva.Layer>,
      endPos?: { x: number; y: number } | null,
      targetId?: string | null
    ) => {
      if (tool === "select") {
        // End selection rect
        endSelectionRect();
        return;
      }

      if ((tool === "brush" || tool === "eraser") && isDrawing && currentLine) {
        // Add the line to the list
        addLine({ ...currentLine });
        setIsDrawing(false);
      }

      if (["rectangle", "circle", "triangle", "star"].includes(tool)) {
        // Find the shape that's currently being drawn
        const drawingShape = shapes.find((shape) => shape.isDrawing);

        if (drawingShape) {
          
            id: drawingShape.id,
            type: drawingShape.type,
            width: drawingShape.width,
            height: drawingShape.height,
          });

          // Update it to finalize the drawing
          updateShape({
            ...drawingShape,
            isDrawing: false,
          });

          // Set this shape as selected
          setSelectedIds([drawingShape.id]);
        }
      }
    },
    [
      tool,
      isDrawing,
      currentLine,
      shapes,
      addLine,
      setIsDrawing,
      updateShape,
      setSelectedIds,
      endSelectionRect,
    ]
  );

  const renderShape = useCallback(
    (shape: any) => {
      const isSelected = selectedIds.includes(shape.id);
      // Always use absolute values for width and height to handle negative drawing directions
      const width = Math.abs(shape.width);
      const height = Math.abs(shape.height);

      switch (shape.type) {
        case "rectangle": {
          // For rectangles, normalize the coordinates for any drawing direction
          const x = shape.width < 0 ? shape.x + shape.width : shape.x;
          const y = shape.height < 0 ? shape.y + shape.height : shape.y;

          return {
            type: "Rect",
            id: shape.id,
            x: x,
            y: y,
            width,
            height,
            fill: shape.color || brushColor,
            stroke: isSelected ? "#2196F3" : "#000000",
            strokeWidth: isSelected ? 2 : 1,
            name: "shape",
            draggable: tool === "select",
            opacity: 1,
          };
        }

        case "circle":
          // For circles, we need to handle negative width/height by adjusting center position
          let centerX = shape.x;
          let centerY = shape.y;

          if (shape.width < 0) {
            centerX = shape.x + shape.width;
          }

          if (shape.height < 0) {
            centerY = shape.y + shape.height;
          }

          // Final center should be in the middle of the shape's bounding box
          centerX += Math.abs(shape.width) / 2;
          centerY += Math.abs(shape.height) / 2;

          return {
            type: "Ellipse",
            id: shape.id,
            x: centerX,
            y: centerY,
            radiusX: width / 2,
            radiusY: height / 2,
            fill: shape.color || brushColor,
            stroke: isSelected ? "#2196F3" : "transparent",
            strokeWidth: isSelected ? 2 : 0,
            shadowColor: isSelected ? "#2196F3" : "transparent",
            shadowBlur: isSelected ? 10 : 0,
            name: "shape",
            draggable: tool === "select",
            perfectDrawEnabled: true,
            opacity: 1,
            width: undefined, // Not used for Ellipse
            height: undefined, // Not used for Ellipse
          };

        case "triangle":
          // For triangles, we need to handle negative width/height by adjusting center position
          let triCenterX = shape.x;
          let triCenterY = shape.y;

          if (shape.width < 0) {
            triCenterX = shape.x + shape.width;
          }

          if (shape.height < 0) {
            triCenterY = shape.y + shape.height;
          }

          // Final center should be in the middle of the shape's bounding box
          triCenterX += Math.abs(shape.width) / 2;
          triCenterY += Math.abs(shape.height) / 2;

          return {
            type: "RegularPolygon",
            id: shape.id,
            x: triCenterX,
            y: triCenterY,
            sides: 3,
            radius: Math.min(width, height) / 2,
            fill: shape.color || brushColor,
            stroke: isSelected ? "#2196F3" : "transparent",
            strokeWidth: isSelected ? 2 : 0,
            shadowColor: isSelected ? "#2196F3" : "transparent",
            shadowBlur: isSelected ? 10 : 0,
            name: "shape",
            draggable: tool === "select",
            perfectDrawEnabled: true,
            opacity: 1,
            width: undefined, // Not used for RegularPolygon
            height: undefined, // Not used for RegularPolygon
          };

        case "star":
          // For stars, we need to handle negative width/height by adjusting center position
          let starCenterX = shape.x;
          let starCenterY = shape.y;

          if (shape.width < 0) {
            starCenterX = shape.x + shape.width;
          }

          if (shape.height < 0) {
            starCenterY = shape.y + shape.height;
          }

          // Final center should be in the middle of the shape's bounding box
          starCenterX += Math.abs(shape.width) / 2;
          starCenterY += Math.abs(shape.height) / 2;

          return {
            type: "Star",
            id: shape.id,
            x: starCenterX,
            y: starCenterY,
            numPoints: 5,
            innerRadius: Math.min(width, height) / 4,
            outerRadius: Math.min(width, height) / 2,
            fill: shape.color || brushColor,
            stroke: isSelected ? "#2196F3" : "transparent",
            strokeWidth: isSelected ? 2 : 0,
            shadowColor: isSelected ? "#2196F3" : "transparent",
            shadowBlur: isSelected ? 10 : 0,
            name: "shape",
            draggable: tool === "select",
            perfectDrawEnabled: true,
            opacity: 1,
            width: undefined, // Not used for Star
            height: undefined, // Not used for Star
          };

        default:
          // Common props for all other shapes
          return {
            type: "Rect",
            id: shape.id,
            x: shape.x,
            y: shape.y,
            width,
            height,
            fill: shape.color || brushColor,
            stroke: isSelected ? "#2196F3" : "transparent",
            strokeWidth: isSelected ? 2 : 0,
            shadowColor: isSelected ? "#2196F3" : "transparent",
            shadowBlur: isSelected ? 10 : 0,
            name: "shape",
            draggable: tool === "select",
            perfectDrawEnabled: true,
            opacity: 1,
          };
      }
    },
    [brushColor, selectedIds, tool]
  );

  const handleDeleteSelected = useCallback(() => {
    deleteSelectedShapes();
    deleteSelectedLines();
    clearSelection();
  }, [deleteSelectedShapes, deleteSelectedLines, clearSelection]);

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    renderShape,
    handleDeleteSelected,
  };
};
