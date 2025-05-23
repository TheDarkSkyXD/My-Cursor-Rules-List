// @ts-ignore - Ignore missing type declaration for generative-ai
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

interface ContentPart {
  text?: string;
  inlineData?: {
    data: string;
    mimeType: string;
  };
}

interface ApiResponse {
  success: boolean;
  message: string;
  imageData: string | null;
}

export async function POST(request: Request) {
  try {
    // Safe parsing of request body
    let requestBody: { prompt?: string; drawingData?: string };
    try {
      const bodyText = await request.text();

      // Check if body is too large
      if (bodyText.length > 100 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Request body too large (>100MB)" },
          { status: 413 }
        );
      }

      try {
        requestBody = JSON.parse(bodyText);
      } catch (parseError) {
        console.error("Error parsing request JSON:", parseError);
        return NextResponse.json(
          { error: "Invalid JSON in request body" },
          { status: 400 }
        );
      }
    } catch (bodyError) {
      console.error("Error reading request body:", bodyError);
      return NextResponse.json(
        { error: "Failed to read request body" },
        { status: 400 }
      );
    }

    // Get prompt and drawing data
    const { prompt, drawingData } = requestBody;

    // Debug logging

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
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

    // Define the generation content with appropriate type
    let generationContent: any;

    // If drawingData is provided, include it as an image in the request
    if (drawingData) {
      // Create a content part with the base64-encoded image
      const imagePart = {
        inlineData: {
          data: drawingData,
          mimeType: "image/png",
        },
      };

      // Combine drawing with text prompt
      generationContent = [
        imagePart,
        {
          text: `Enhance this image based on the following instructions:
\`\`\`
${prompt}
\`\`\`

**IMPORTANT**: The final image should be a high-quality, follow the my instructions and maintain consistency. You should not include borders or frames around the image.`,
        },
      ];
    } else {
      // Use text-only prompt if no drawing is provided
      generationContent = prompt;
    }

    // Call Gemini API
    const response = await model.generateContent(generationContent);

    // Initialize response data
    const result: ApiResponse = {
      success: true,
      message: "",
      imageData: null,
    };

    // Process response parts - safely access candidates and content
    // @ts-ignore - Handle Gemini API response structure
    if (response?.response?.candidates?.[0]?.content?.parts) {
      // @ts-ignore - Cast to our ContentPart type
      const parts = response.response.candidates[0].content
        .parts as ContentPart[];
      for (const part of parts) {
        // Based on the part type, either get the text or image data
        if (part.text) {
          result.message = part.text;
        } else if (part.inlineData) {
          result.imageData = part.inlineData.data;
        }
      }
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error generating content:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate image",
      },
      { status: 500 }
    );
  }
}
