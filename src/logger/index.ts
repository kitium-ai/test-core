/**
 * Logger module for test utilities
 * Re-exports and wraps @kitiumai/logger for test-specific use cases
 */

import {
  getLogger,
  LoggerBuilder,
  type ILogger,
  type LogContext as LoggerLogContext,
  LogLevel,
} from '@kitiumai/logger';
import { randomUUID } from 'crypto';

// Re-export types and enums from @kitiumai/logger
export { LogLevel } from '@kitiumai/logger';
export type { LogContext } from '@kitiumai/logger';

// Re-export logger interface
export type { ILogger } from '@kitiumai/logger';

/**
 * Test-specific logger interface that extends ILogger
 */
export type TestLogger = {
  getLogs(level?: LogLevel): Array<{
    timestamp: string;
    level: string;
    message: string;
    context?: Record<string, unknown>;
    error?: Error;
  }>;
  clear(): void;
} & ILogger;

/**
 * In-memory log storage for test assertions
 */
class TestLogStorage {
  private logs: Array<{
    timestamp: string;
    level: string;
    message: string;
    context?: Record<string, unknown>;
    error?: Error;
  }> = [];

  add(entry: {
    timestamp: string;
    level: string;
    message: string;
    context?: Record<string, unknown>;
    error?: Error;
  }): void {
    this.logs.push(entry);
  }

  get(level?: string): Array<{
    timestamp: string;
    level: string;
    message: string;
    context?: Record<string, unknown>;
    error?: Error;
  }> {
    if (!level) {
      return [...this.logs];
    }
    return this.logs.filter((log) => log.level === level);
  }

  clear(): void {
    this.logs = [];
  }
}

/**
 * Test logger wrapper that uses @kitiumai/logger with in-memory storage
 */
class TestLoggerWrapper implements TestLogger {
  private readonly logger: ILogger;
  private readonly storage: TestLogStorage;
  private readonly context: LoggerLogContext;

  constructor(logger: ILogger, storage: TestLogStorage, context?: Partial<LoggerLogContext>) {
    this.logger = logger;
    this.storage = storage;
    // Ensure traceId is present as required by LogContext
    const traceId = context?.traceId ?? randomUUID();
    this.context = {
      traceId,
      ...(context?.spanId !== undefined && { spanId: context.spanId }),
      ...(context?.userId !== undefined && { userId: context.userId }),
      ...(context?.requestId !== undefined && { requestId: context.requestId }),
      ...(context?.sessionId !== undefined && { sessionId: context.sessionId }),
      ...(context?.correlationId !== undefined && { correlationId: context.correlationId }),
    };
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    const entry = {
      timestamp: new Date().toISOString(),
      level: 'debug',
      message,
      context: { ...this.context, ...metadata },
    };
    this.storage.add(entry);
    this.logger.debug(message, metadata);
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    const entry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      context: { ...this.context, ...metadata },
    };
    this.storage.add(entry);
    this.logger.info(message, metadata);
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    const entry = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      context: { ...this.context, ...metadata },
    };
    this.storage.add(entry);
    this.logger.warn(message, metadata);
  }

  error(message: string, metadata?: Record<string, unknown>, error?: Error): void {
    const entry: {
      timestamp: string;
      level: string;
      message: string;
      context?: Record<string, unknown>;
      error?: Error;
    } = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      context: { ...this.context, ...metadata },
    };
    if (error) {
      entry.error = error;
    }
    this.storage.add(entry);
    this.logger.error(message, metadata, error);
  }

  http(message: string, metadata?: Record<string, unknown>): void {
    const entry = {
      timestamp: new Date().toISOString(),
      level: 'http',
      message,
      context: { ...this.context, ...metadata },
    };
    this.storage.add(entry);
    this.logger.http(message, metadata);
  }

  withContext<T>(context: Partial<LoggerLogContext>, fn: () => T | Promise<T>): T | Promise<T> {
    return this.logger.withContext(context, fn);
  }

  child(metadata: Record<string, unknown>): ILogger {
    return new TestLoggerWrapper(this.logger.child(metadata), this.storage, {
      ...this.context,
      ...metadata,
    });
  }

  async close(): Promise<void> {
    await this.logger.close();
  }

  getLogs(level?: LogLevel): Array<{
    timestamp: string;
    level: string;
    message: string;
    context?: Record<string, unknown>;
    error?: Error;
  }> {
    if (!level) {
      return this.storage.get();
    }
    return this.storage.get(level.toLowerCase());
  }

  clear(): void {
    this.storage.clear();
  }
}

// Global storage instance
const globalStorage = new TestLogStorage();

/**
 * Create a test logger instance
 * Uses @kitiumai/logger with test-specific features
 */
export function createLogger(level?: LogLevel, context?: Partial<LoggerLogContext>): TestLogger {
  const logger = LoggerBuilder.console(level ?? LogLevel.INFO);
  return new TestLoggerWrapper(logger, globalStorage, context);
}

/**
 * Get the default test logger
 */
export function getTestLogger(): TestLogger {
  const logger = getLogger();
  return new TestLoggerWrapper(logger, globalStorage);
}

// Default export for backward compatibility
export default TestLoggerWrapper;
