import { NextRequest, NextResponse } from 'next/server';
// import { ErrorReport } from '@/types/monitoring'; // Assuming this type is still valid or not strictly needed
import { logger } from '@/lib/monitoring/logger';
// import { getServerSession } from 'next-auth';
// import { authOptions } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server'; // Import Supabase client
import { cookies } from 'next/headers'; // Import cookies
import { z } from 'zod';

const errorReportSchema = z.object({
  message: z.string(),
  stack: z.string().optional(),
  timestamp: z.string().datetime(), // Use datetime for validation
  context: z.record(z.unknown()).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  source: z.string(),
  // userId will be added server-side if user is authenticated
  sessionId: z.string().optional(), // Keep client-provided sessionId if useful
}).strict();

export async function POST(request: NextRequest) { // Use NextRequest
  let supabaseUserId: string | undefined = undefined;

  try {
    // Attempt to get Supabase user - this might fail if cookies are invalid/missing, which is okay for logging
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    if (supabaseUser) {
        supabaseUserId = supabaseUser.id;
    }

    const body = await request.json();

    // Validate received data against the schema
    const validationResult = errorReportSchema.safeParse(body);
    if (!validationResult.success) {
      // Log the validation error itself, but don't expose details potentially
      logger.warn('Invalid error report received', { validationErrors: validationResult.error.errors, rawBody: body });
      return NextResponse.json(
        { error: 'Dados de erro inválidos' },
        { status: 400 }
      );
    }

    const errorReport = validationResult.data;

    // Log the error using the logger, adding server-side context
    logger.error(`Cliente Error [${errorReport.source}]: ${errorReport.message}`, {
      clientReport: errorReport, // Log the validated client data
      supabaseUserId: supabaseUserId, // Add Supabase user ID if available
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? request.ip, // Get IP address
      // Add any other relevant server-side context
    });

    // Placeholder for future enhancements
    // TODO: Store error in a dedicated error table in the database (associate with user ID if available)
    // TODO: Implement logic to notify developers for critical errors (e.g., email, Slack)
    // TODO: Consider error aggregation service or logic

    // Send a generic success response
    return NextResponse.json({ message: 'Erro registrado com sucesso' });

  } catch (processingError) {
    // Log errors that happen *during* the processing of the client error report
    logger.error('Falha ao processar erro reportado pelo cliente', {
        error: processingError,
        originalRequestBody: await request.text().catch(() => 'Could not read original body') // Try to log original body on processing failure
    });
    return NextResponse.json(
      { error: 'Erro interno ao processar relatório de erro' },
      { status: 500 }
    );
  }
} 