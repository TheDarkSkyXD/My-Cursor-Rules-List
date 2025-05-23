"use client";

import { Editor, Tldraw } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import { useState } from "react";

interface TldrawEditorProps {
	onImageExport?: (imageUrl: string) => void;
	onAIRequest?: (imageUrl: string, selectedShapeIds: string[]) => void;
	generatedImageUrl?: string | null;
	onEditorMount?: (editor: Editor) => void;
}

export function TldrawEditor({
	onImageExport,
	onAIRequest,
	generatedImageUrl,
	onEditorMount,
}: TldrawEditorProps) {
	// Store editor reference for event handlers
	const [editorRef, setEditorRef] = useState<Editor | null>(null);

	// Handle export
	const handleExport = async () => {
		if (!editorRef) return;

		try {
			const shapeIds = editorRef.getCurrentPageShapeIds();
			const result = await editorRef.toImage([...shapeIds], {
				format: "png",
				background: true,
			});

			if (result.blob && onImageExport) {
				const url = URL.createObjectURL(result.blob);
				onImageExport(url);
			}
		} catch (err) {
			console.error("Error exporting image:", err);
		}
	};

	// Handle AI edit
	const handleAIEdit = async () => {
		if (!editorRef) return;

		try {
			const selectedShapeIds = [...editorRef.getSelectedShapeIds()];

			if (selectedShapeIds.length === 0) {
				alert("Please select something to edit with AI");
				return;
			}

			// When capturing the image for AI editing, we need to be careful
			// to only capture the selected shapes and nothing else
			const result = await editorRef.toImage(selectedShapeIds as any, {
				format: "png",
				background: true,
				// Scale 2 to get better resolution for AI processing
				scale: 2,
				// Padding 0 to avoid including surrounding area
				padding: 0,
			});

			if (result.blob && onAIRequest) {
				const url = URL.createObjectURL(result.blob);
				onAIRequest(url, selectedShapeIds);
			}
		} catch (err) {
			console.error("Error in AI edit:", err);
		}
	};

	// Handle editor mount
	const handleMount = (editor: Editor) => {
		setEditorRef(editor);

		if (onEditorMount) {
			onEditorMount(editor);
		}
	};

	return (
		<div className="h-full flex flex-col">
			<div className="flex items-center justify-between p-2 bg-white border-b">
				<div className="flex space-x-2">{/* Left side - empty now */}</div>
				<div className="flex space-x-2">
					<a
						href="https://github.com/tuan3w/SnapPal"
						target="_blank"
						rel="noopener noreferrer"
						className="custom-button px-3 py-2 rounded-full bg-gradient-to-r from-pink-400 to-orange-400 text-white hover:from-pink-500 hover:to-orange-500 transition-all shadow-md hover:shadow-lg transform hover:scale-105 flex items-center gap-2 font-medium"
						data-isactive="true"
						style={{ fontSize: "14px" }}
					>
						<div className="flex items-center">
							<span className="text-xl mr-1">🎨</span>
							<span>Check our code</span>
							<span className="text-xl ml-1">✨</span>
						</div>
					</a>
				</div>
			</div>
			<div className="flex-1 relative">
				<Tldraw onMount={handleMount} />
			</div>
		</div>
	);
}
