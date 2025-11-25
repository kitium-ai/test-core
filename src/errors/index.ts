/**
 * Enhanced error handling for all test frameworks
 * Provides rich, actionable error messages with context
 */

export type ErrorContext = {
  selector?: string;
  triedSelectors?: string[];
  suggestion?: string;
  pageUrl?: string;
  screenshot?: string;
  testName?: string;
  [key: string]: unknown;
};

/**
 * Enhanced test error with rich context
 * Can be extended by framework-specific error classes
 */
export class EnhancedTestError extends Error {
  constructor(
    message: string,
    public readonly context?: ErrorContext
  ) {
    super(message);
    this.name = 'EnhancedTestError';
  }

  override toString(): string {
    let errorMessage = `${this.name}: ${this.message}`;

    if (this.context) {
      if (this.context.testName) {
        errorMessage += `\n  Test: ${this.context.testName}`;
      }

      if (this.context.pageUrl) {
        errorMessage += `\n  Page URL: ${this.context.pageUrl}`;
      }

      if (this.context.selector) {
        errorMessage += `\n  Selector: ${this.context.selector}`;
      }

      if (this.context.triedSelectors && this.context.triedSelectors.length > 0) {
        errorMessage += `\n  Tried selectors:\n    ${this.context.triedSelectors.join('\n    ')}`;
      }

      if (this.context.suggestion) {
        errorMessage += `\n  💡 Suggestion: ${this.context.suggestion}`;
      }

      if (this.context.screenshot) {
        errorMessage += `\n  📸 Screenshot: ${this.context.screenshot}`;
      }

      // Add any additional context properties
      const knownKeys = new Set([
        'selector',
        'triedSelectors',
        'suggestion',
        'pageUrl',
        'screenshot',
        'testName',
      ]);
      const additionalContext = Object.entries(this.context)
        .filter(([key]) => !knownKeys.has(key))
        .map(([key, value]) => `  ${key}: ${JSON.stringify(value)}`)
        .join('\n');

      if (additionalContext) {
        errorMessage += `\n${additionalContext}`;
      }
    }

    return errorMessage;
  }
}

/**
 * Common test error messages with actionable suggestions
 */
export const TestErrorMessages = {
  timeout: (action: string, timeoutMs: number) => ({
    message: `Timeout waiting for ${action} (${timeoutMs}ms)`,
    suggestion:
      'Increase timeout if the operation legitimately takes longer, or check if the expected condition will ever be met.',
  }),

  networkRequestFailed: (url: string, status?: number) => ({
    message: `Network request failed: ${url}${status ? ` (status: ${status})` : ''}`,
    suggestion:
      'Check network conditions, CORS configuration, and that the API endpoint is accessible.',
  }),

  assertionFailed: (expected: unknown, actual: unknown) => ({
    message: `Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`,
    suggestion: 'Verify your test expectations match the actual behavior.',
  }),

  unexpectedError: (error: unknown) => ({
    message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
    suggestion: 'Check the error details and stack trace for more information.',
  }),

  setupFailed: (resource: string) => ({
    message: `Failed to set up ${resource}`,
    suggestion:
      'Ensure all test dependencies are properly configured and available before running tests.',
  }),

  teardownFailed: (resource: string) => ({
    message: `Failed to tear down ${resource}`,
    suggestion: 'Check for resource cleanup issues or hanging operations.',
  }),
};

/**
 * Create an enhanced test error with context
 */
export function createTestError(
  type: keyof typeof TestErrorMessages,
  ...args: unknown[]
): EnhancedTestError {
  const errorData = (
    TestErrorMessages[type] as (...args: unknown[]) => {
      message: string;
      suggestion?: string;
    }
  )(...args);

  const context: ErrorContext = {};
  if (errorData.suggestion) {
    context.suggestion = errorData.suggestion;
  }

  return new EnhancedTestError(errorData.message, context);
}

/**
 * Wrap an existing error with enhanced context
 */
export function enhanceError(error: Error, context?: ErrorContext): EnhancedTestError {
  if (error instanceof EnhancedTestError) {
    // Merge contexts if already enhanced
    return new EnhancedTestError(error.message, {
      ...error.context,
      ...context,
    });
  }

  return new EnhancedTestError(error.message, context);
}
