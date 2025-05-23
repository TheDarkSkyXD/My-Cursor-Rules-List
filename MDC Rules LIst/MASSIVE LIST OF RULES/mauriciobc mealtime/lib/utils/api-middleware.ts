import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

// Define the expected signature for a Next.js App Router API route handler
// It might accept Request and a context object with params
type Handler<Params = any> = (
    request: Request,
    context: { params: Promise<Params> } 
) => Promise<NextResponse>;

/**
 * Higher-order function to wrap Next.js API route handlers 
 * with consistent error handling.
 *
 * @param handler The original API route handler function.
 * @returns A new handler function with error catching capabilities.
 */
export const withError = <Params = any>(handler: Handler<Params>): Handler<Params> => {
    return async (request: Request, context: { params: Promise<Params> }) => {
        try {
            // Execute the original handler
            // Passing the original request object, NOT cloning it by default
            return await handler(request, context);
        } catch (error: unknown) {
            // Log the error for server-side debugging
            console.error('[withError] API Route Error:', error);

            // Handle Zod validation errors specifically
            if (error instanceof ZodError) {
                return NextResponse.json(
                    {
                        error: 'Validation failed',
                        details: error.flatten(), // Provides structured validation errors
                    },
                    { status: 400 } // Bad Request
                );
            }

            // Handle generic errors
            const errorMessage =
                error instanceof Error ? error.message : 'An internal server error occurred';
            
            return NextResponse.json(
                { error: errorMessage },
                { status: 500 } // Internal Server Error
            );
        }
    };
}; 