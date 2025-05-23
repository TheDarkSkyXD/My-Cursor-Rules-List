"use client";

import { useState } from "react";

interface ToolPanelProps {
	onAiGenerate: (prompt: string) => void;
	isLoading: boolean;
}

const ToolPanel = ({ onAiGenerate, isLoading }: ToolPanelProps) => {
	const [prompt, setPrompt] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (prompt.trim()) {
			onAiGenerate(prompt);
		}
	};

	return (
		<div className="space-y-4">
			<h3 className="text-lg font-medium">AI Drawing Assistant</h3>
			<form onSubmit={handleSubmit} className="space-y-3">
				<div>
					<label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">
						Describe what you want to draw
					</label>
					<textarea
						id="prompt"
						className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
						rows={4}
						value={prompt}
						onChange={(e) => setPrompt(e.target.value)}
						placeholder="Example: Draw a landscape with mountains and a lake"
					/>
				</div>
				<button
					type="submit"
					className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
					disabled={isLoading || !prompt.trim()}
				>
					{isLoading ? "Generating..." : "Generate Drawing Guidance"}
				</button>
			</form>

			<div className="border-t pt-4">
				<h4 className="text-sm font-medium text-gray-700 mb-2">Quick Actions</h4>
				<div className="grid grid-cols-2 gap-2">
					<button className="py-1 px-2 bg-gray-100 rounded text-sm hover:bg-gray-200">
						Fix Proportions
					</button>
					<button className="py-1 px-2 bg-gray-100 rounded text-sm hover:bg-gray-200">
						Improve Lines
					</button>
					<button className="py-1 px-2 bg-gray-100 rounded text-sm hover:bg-gray-200">
						Add Shading
					</button>
					<button className="py-1 px-2 bg-gray-100 rounded text-sm hover:bg-gray-200">
						Suggest Colors
					</button>
				</div>
			</div>

			<div className="border-t pt-4">
				<h4 className="text-sm font-medium text-gray-700 mb-2">Tips</h4>
				<ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
					<li>Be specific in your prompts for better results</li>
					<li>Try uploading a rough sketch first</li>
					<li>Use the eraser to remove unwanted lines</li>
					<li>Save your work regularly</li>
				</ul>
			</div>
		</div>
	);
};

export default ToolPanel;
