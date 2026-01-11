/**
 * Client-side error tracking utility for observability
 * Captures and reports frontend errors for debugging
 */

interface ErrorContext {
  action: string;
  token?: string;
  commentId?: string;
  prototypeId?: string;
  userId?: string;
  [key: string]: unknown;
}

interface ErrorReport {
  message: string;
  context: ErrorContext;
  timestamp: string;
  url: string;
  userAgent: string;
  stack?: string;
}

// In-memory buffer for recent errors (useful for debugging)
const errorBuffer: ErrorReport[] = [];
const MAX_BUFFER_SIZE = 50;

/**
 * Report an error with context for debugging
 */
export function reportError(
  error: Error | string,
  context: ErrorContext
): void {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  const report: ErrorReport = {
    message: errorMessage,
    context,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    stack: errorStack,
  };
  
  // Add to buffer
  errorBuffer.push(report);
  if (errorBuffer.length > MAX_BUFFER_SIZE) {
    errorBuffer.shift();
  }
  
  // Log to console in development
  console.error('[ErrorReport]', {
    message: errorMessage,
    context,
    stack: errorStack,
  });
  
  // In production, could POST to an edge function for persistence
  // For now, we keep it simple with console logging
}

/**
 * Report a failed API call with response details
 */
export async function reportApiError(
  response: Response,
  context: ErrorContext
): Promise<void> {
  let errorBody = '';
  try {
    errorBody = await response.text();
  } catch {
    errorBody = 'Could not read response body';
  }
  
  reportError(
    `API Error: ${response.status} ${response.statusText}`,
    {
      ...context,
      statusCode: response.status,
      statusText: response.statusText,
      responseBody: errorBody.slice(0, 500), // Truncate long responses
    }
  );
}

/**
 * Get recent errors from buffer (for debugging)
 */
export function getRecentErrors(): ErrorReport[] {
  return [...errorBuffer];
}

/**
 * Clear error buffer
 */
export function clearErrorBuffer(): void {
  errorBuffer.length = 0;
}

/**
 * Create a wrapper for async operations with error reporting
 */
export function withErrorReporting<T>(
  operation: () => Promise<T>,
  context: ErrorContext
): Promise<T> {
  return operation().catch((error) => {
    reportError(error, context);
    throw error;
  });
}
