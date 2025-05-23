// @ts-ignore - Ignore missing type declaration for generative-ai
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

interface ApiResponse {
  success: boolean;
  message: string;
  editedImageData: string | null;
}

export async function POST(request: Request) {
  try {
    const { imageData, selection, prompt } = await request.json();

    if (!imageData || !selection || !prompt) {
      return NextResponse.json(
        { error: "Image data, selection area, and prompt are required" },
        { status: 400 }
      );
    }

    // Get API key from environment variable
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is not configured on the server" },
        { status: 500 }
      );
    }

    // Initialize Google Generative AI
    const genAI = new GoogleGenerativeAI(apiKey);

    // Set model with image generation capabilities
    // @ts-ignore - We need to ignore type checking for the Gemini API config
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp-image-generation",
      generationConfig: {
        // @ts-ignore - For Gemini's new API properties
        responseModalities: ["Text", "Image"],
      },
    });

    // Create a content part with the base64-encoded image
    const imagePart = {
      inlineData: {
        data: imageData,
        mimeType: "image/png",
      },
    };

    // Combine drawing with text prompt, indicating the selection area
    const generationContent = [
      imagePart,
      {
        text: `${prompt}. Focus on the selected area: ${JSON.stringify(
          selection
        )}. Keep the overall style consistent.`,
      },
    ];

    // Call Gemini API
    const response = await model.generateContent(generationContent);

    // Initialize response data
    const result: ApiResponse = {
      success: true,
      message: "",
      editedImageData: null,
    };

    // Process response parts - safely access candidates and content
    // @ts-ignore - Handle Gemini API response structure
    if (response?.response?.candidates?.[0]?.content?.parts) {
      // @ts-ignore - Cast to the expected type
      const parts = response.response.candidates[0].content.parts;
      for (const part of parts) {
        // Based on the part type, either get the text or image data
        if (part.text) {
          result.message = part.text;
        } else if (part.inlineData) {
          result.editedImageData = part.inlineData.data;
        }
      }
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error in AI image editing:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process image edit",
      },
      { status: 500 }
    );
  }
}
