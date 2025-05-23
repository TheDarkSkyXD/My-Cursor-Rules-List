import { NextResponse } from 'next/server';

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

export function handleApiError(error: unknown, context: string): NextResponse {
  console.error(`[${context}] Error:`, error);

  // Handle Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code: string; meta?: { target?: string[] } };
    
    switch (prismaError.code) {
      case 'P2002': // Unique constraint violation
        return NextResponse.json(
          { error: 'Conflito de dados. Por favor, tente novamente.' },
          { status: 409 }
        );
      case 'P2025': // Record not found
        return NextResponse.json(
          { error: 'Registro não encontrado' },
          { status: 404 }
        );
      case 'P2003': // Foreign key constraint violation
        return NextResponse.json(
          { error: 'Operação inválida: referência não encontrada' },
          { status: 400 }
        );
    }
  }

  // Handle known error types
  if (error instanceof Error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  // Default server error
  return NextResponse.json(
    { error: 'Erro interno do servidor' },
    { status: 500 }
  );
}

export function handleAuthError(error: unknown, context: string): NextResponse {
  console.error(`[${context}] Auth Error:`, error);
  return NextResponse.json(
    { error: 'Não autorizado' },
    { status: 401 }
  );
}

export function handleValidationError(error: unknown, context: string): NextResponse {
  console.error(`[${context}] Validation Error:`, error);
  return NextResponse.json(
    { error: 'Dados inválidos', details: error },
    { status: 400 }
  );
} 