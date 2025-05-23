"use client";

import { useDrawPilotStore } from "@/store";
import { SendHorizontal } from "lucide-react";
import { useState } from "react";

interface ChatBoxProps {
	onSubmit: (prompt: string) => Promise<void>;
}

export function ChatBox({ onSubmit }: ChatBoxProps) {
	const [prompt, setPrompt] = useState("");
	const { isProcessingAI } = useDrawPilotStore();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!prompt.trim() || isProcessingAI) return;

		try {
			await onSubmit(prompt);
			setPrompt(""); // Clear the input after submission
		} catch (error) {
			console.error("Error submitting prompt:", error);
		}
	};

	return (
		<div className="border-t border-gray-200 bg-white p-2">
			<form onSubmit={handleSubmit} className="flex items-center gap-2">
				<input
					type="text"
					value={prompt}
					onChange={(e) => setPrompt(e.target.value)}
					placeholder="Describe what to add or change in the drawing..."
					className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
					disabled={isProcessingAI}
				/>
				<button
					type="submit"
					className="flex items-center justify-center rounded-md bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:opacity-50"
					disabled={!prompt.trim() || isProcessingAI}
				>
					<SendHorizontal className="h-5 w-5" />
				</button>
			</form>
		</div>
	);
}
