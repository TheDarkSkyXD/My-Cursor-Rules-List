"use client";

import { useState } from "react";

interface ColorPickerProps {
	currentColor: string;
	onColorChange: (color: string) => void;
}

const COLORS = [
	"#000000", // Black
	"#ffffff", // White
	"#df4b26", // Red
	"#4b8df5", // Blue
	"#4caf50", // Green
	"#ffeb3b", // Yellow
	"#ff9800", // Orange
	"#9c27b0", // Purple
	"#795548", // Brown
	"#9e9e9e", // Gray
];

const ColorPicker = ({ currentColor, onColorChange }: ColorPickerProps) => {
	const [isCustomColorOpen, setIsCustomColorOpen] = useState(false);
	const [customColor, setCustomColor] = useState(currentColor);

	const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setCustomColor(e.target.value);
	};

	const handleCustomColorApply = () => {
		onColorChange(customColor);
		setIsCustomColorOpen(false);
	};

	return (
		<div className="space-y-2">
			<h4 className="text-sm font-medium text-gray-700">Colors</h4>
			<div className="flex flex-wrap gap-2">
				{COLORS.map((color) => (
					<button
						key={color}
						className={`w-8 h-8 rounded-full ${
							color === currentColor ? "ring-2 ring-offset-2 ring-indigo-500" : ""
						}`}
						style={{
							backgroundColor: color,
							border: color === "#ffffff" ? "1px solid #e2e8f0" : "none",
						}}
						onClick={() => onColorChange(color)}
						aria-label={`Select color ${color}`}
					/>
				))}
				<button
					className={`w-8 h-8 rounded-full ${
						!COLORS.includes(currentColor) ? "ring-2 ring-offset-2 ring-indigo-500" : ""
					}`}
					style={{
						background: "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)",
						position: "relative",
					}}
					onClick={() => setIsCustomColorOpen(!isCustomColorOpen)}
					aria-label="Custom color"
				>
					{!COLORS.includes(currentColor) && (
						<span
							className="absolute inset-1 rounded-full"
							style={{ backgroundColor: currentColor }}
						/>
					)}
				</button>
			</div>

			{isCustomColorOpen && (
				<div className="mt-2 p-2 border rounded shadow-sm bg-white">
					<div className="flex items-center gap-2">
						<input
							type="color"
							value={customColor}
							onChange={handleCustomColorChange}
							className="h-8 w-10"
						/>
						<input
							type="text"
							value={customColor}
							onChange={(e) => setCustomColor(e.target.value)}
							className="flex-1 px-2 py-1 border rounded text-sm"
						/>
						<button
							onClick={handleCustomColorApply}
							className="px-2 py-1 bg-indigo-600 text-white rounded text-sm"
						>
							Apply
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default ColorPicker;
