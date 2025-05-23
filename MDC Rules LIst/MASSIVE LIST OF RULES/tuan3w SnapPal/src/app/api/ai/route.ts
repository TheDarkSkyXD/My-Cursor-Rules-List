import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		const { prompt } = await request.json();

		if (!prompt) {
			return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
		}

		// This is a placeholder - in a real app, you would call an AI service
		// Simulate AI processing with a timeout
		await new Promise((resolve) => setTimeout(resolve, 1000));

		const guidance = {
			prompt,
			steps: [
				"Start by sketching the main outline",
				"Add details to the central elements",
				"Work on the background elements",
				"Refine the proportions and perspective",
				"Add finishing touches and details",
			],
			suggestions: [
				"Try using lighter strokes for distant objects",
				"Consider the light source for consistent shadows",
				"Use varied line weights to add depth",
			],
		};

		return NextResponse.json({ guidance });
	} catch (error) {
		console.error("Error in AI drawing guidance:", error);
		return NextResponse.json({ error: "Failed to generate drawing guidance" }, { status: 500 });
	}
}
