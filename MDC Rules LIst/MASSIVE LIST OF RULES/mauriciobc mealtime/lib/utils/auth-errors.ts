import { NextResponse } from 'next/server';
import { logger } from '@/lib/monitoring/logger';

// Define error codes and their corresponding HTTP status codes
const ERROR_STATUS_CODES: Record<string, number> = {
  'auth/invalid-email': 400,
  'auth/user-disabled': 403,
  'auth/user-not-found': 404,
  'auth/wrong-password': 401,
  'auth/email-already-in-use': 409,
  'auth/weak-password': 400,
  'auth/invalid-action-code': 400,
  'auth/invalid-verification-code': 400,
  'auth/expired-action-code': 400,
  'auth/expired-verification-code': 400,
  'auth/requires-recent-login': 401,
  'auth/too-many-requests': 429,
  'auth/unauthorized': 401,
  'auth/session-expired': 401,
  'default': 500
};

// Custom auth error class
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

// Get the appropriate HTTP status code for an error
function getStatusCodeForError(code: string): number {
  return ERROR_STATUS_CODES[code] || ERROR_STATUS_CODES.default;
}

// Translate error messages to user-friendly messages
function getErrorMessage(error: AuthError): string {
  const errorMessages: Record<string, string> = {
    'auth/invalid-email': 'O endereço de email fornecido é inválido.',
    'auth/user-disabled': 'Esta conta foi desativada.',
    'auth/user-not-found': 'Não encontramos uma conta com este email.',
    'auth/wrong-password': 'Email ou senha incorretos.',
    'auth/email-already-in-use': 'Este email já está em uso.',
    'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
    'auth/invalid-action-code': 'O código de verificação é inválido ou expirou.',
    'auth/invalid-verification-code': 'O código de verificação é inválido.',
    'auth/expired-action-code': 'O código de verificação expirou.',
    'auth/expired-verification-code': 'O código de verificação expirou.',
    'auth/requires-recent-login': 'Por favor, faça login novamente para continuar.',
    'auth/too-many-requests': 'Muitas tentativas. Por favor, tente novamente mais tarde.',
    'auth/unauthorized': 'Você não tem permissão para acessar este recurso.',
    'auth/session-expired': 'Sua sessão expirou. Por favor, faça login novamente.',
  };

  return errorMessages[error.code] || error.message;
}

// Main error handler for auth operations
export function handleAuthError(error: unknown): NextResponse {
  // Log the original error for debugging
  logger.error('[Auth] Error:', error);

  // Handle AuthError instances
  if (error instanceof AuthError) {
    const statusCode = getStatusCodeForError(error.code);
    const userMessage = getErrorMessage(error);

    logger.error('[Auth] AuthError:', {
      code: error.code,
      message: error.message,
      context: error.context,
      statusCode
    });

    return NextResponse.json(
      { error: userMessage },
      { status: statusCode }
    );
  }

  // Handle unknown errors
  if (error instanceof Error) {
    logger.error('[Auth] Unexpected Error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    return NextResponse.json(
      { error: 'Ocorreu um erro inesperado. Por favor, tente novamente.' },
      { status: 500 }
    );
  }

  // Handle non-Error objects
  logger.error('[Auth] Unknown Error:', { error });
  return NextResponse.json(
    { error: 'Ocorreu um erro inesperado. Por favor, tente novamente.' },
    { status: 500 }
  );
} 