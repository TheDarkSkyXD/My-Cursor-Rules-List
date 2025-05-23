"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useState } from "react";
import { Toaster } from "sonner";

// Dynamically import the canvas component to prevent SSR issues with Konva
const DrawingCanvas = dynamic(() => import("@/features/canvas/components/drawing-canvas"), {
	ssr: false,
	loading: () => (
		<div className="flex items-center justify-center h-screen w-full">
			<p className="text-gray-500">Loading drawing canvas...</p>
		</div>
	),
});

export default function Home() {
	const [isClient, setIsClient] = useState(false);

	useEffect(() => {
		setIsClient(true);
	}, []);

	return (
		<main className="h-screen flex flex-col overflow-hidden bg-white">
			<Toaster position="top-center" />
			{!isClient ? (
				<div className="flex-1 flex items-center justify-center">
					<p className="text-gray-500">Loading drawing canvas...</p>
				</div>
			) : (
				<Suspense
					fallback={<div className="flex-1 flex items-center justify-center">Loading...</div>}
				>
					<div className="flex-1 flex flex-col">
						<DrawingCanvas />
					</div>
				</Suspense>
			)}
		</main>
	);
}
