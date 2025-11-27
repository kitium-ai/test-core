/**
 * Logger module for test utilities
 * Re-exports and wraps @kitiumai/logger for test-specific use cases
 */

import { randomUUID } from 'node:crypto';

import {
  createLogger as createCoreLogger,
  getLogger,
  getPresetConfig,
  type ILogger,
  type LogContext as LoggerLogContext,
  LogLevel,
} from '@kitiumai/logger';

// Re-export types and enums from @kitiumai/logger
export type { LogContext } from '@kitiumai/logger';
export { LogLevel } from '@kitiumai/logger';

// Re-export logger interface
export type { ILogger } from '@kitiumai/logger';

/**
 * Test-specific logger interface that extends ILogger
 */
export type TestLogEntry = {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: Error;
};

export type GetLogsOptions = {
  level?: LogLevel;
  after?: Date | string;
};

export type TestLogger = {
  getLogs(options?: GetLogsOptions): TestLogEntry[];
  clear(): void;
} & ILogger;

/**
 * In-memory log storage for test assertions
 */
class TestLogStorage {
  private logs: TestLogEntry[] = [];

  add(entry: TestLogEntry): void {
    this.logs.push(entry);
  }

  get(options?: GetLogsOptions): TestLogEntry[] {
    let normalizedAfter: Date | undefined;
    if (options?.after) {
      if (typeof options.after === 'string') {
        normalizedAfter = new Date(options.after);
      } else {
        normalizedAfter = options.after;
      }
    }

    const filtered = this.logs.filter((log) => {
      if (options?.level && log.level !== options.level) {
        return false;
      }

      if (normalizedAfter && new Date(log.timestamp).getTime() <= normalizedAfter.getTime()) {
        return false;
      }

      return true;
    });

    return [...filtered].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
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
    this.storage.add(this.buildEntry(LogLevel.DEBUG, message, metadata));
    this.logger.debug(message, metadata);
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    this.storage.add(this.buildEntry(LogLevel.INFO, message, metadata));
    this.logger.info(message, metadata);
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.storage.add(this.buildEntry(LogLevel.WARN, message, metadata));
    this.logger.warn(message, metadata);
  }

  error(message: string, metadata?: Record<string, unknown>, error?: Error): void {
    this.storage.add(this.buildEntry(LogLevel.ERROR, message, metadata, error));
    this.logger.error(message, metadata, error);
  }

  http(message: string, metadata?: Record<string, unknown>): void {
    this.storage.add(this.buildEntry(LogLevel.HTTP, message, metadata));
    this.logger.http(message, metadata);
  }

  withContext<T>(
    context: Partial<LoggerLogContext>,
    function_: () => T | Promise<T>
  ): T | Promise<T> {
    return this.logger.withContext(context, function_);
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

  getLogs(options?: GetLogsOptions): TestLogEntry[] {
    return this.storage.get(options);
  }

  clear(): void {
    this.storage.clear();
  }
  private buildEntry(
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>,
    error?: Error
  ): TestLogEntry {
    const entry: TestLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...metadata },
    };

    if (error) {
      entry.error = error;
    }

    return entry;
  }
}

// Global storage instance
const globalStorage = new TestLogStorage();

/**
 * Create a test logger instance
 * Uses @kitiumai/logger with test-specific features
 */
export function createLogger(level?: LogLevel, context?: Partial<LoggerLogContext>): TestLogger {
  const loggerConfig = getPresetConfig('development', {
    logLevel: level ?? LogLevel.INFO,
    serviceName: 'test-core',
  });
  const logger = createCoreLogger(loggerConfig);
  return new TestLoggerWrapper(logger, globalStorage, context);
}

/**
 * Get the default test logger
 */
export function getTestLogger(): TestLogger {
  const logger = getLogger();
  return new TestLoggerWrapper(logger, globalStorage);
}

export type LogExpectation = {
  level?: LogLevel;
  after?: Date | string;
  contains?: Array<string | RegExp>;
  minimum?: number;
};

export function expectLogs(testLogger: TestLogger, expectation: LogExpectation): TestLogEntry[] {
  const options: GetLogsOptions = {};
  if (expectation.level !== undefined) options.level = expectation.level;
  if (expectation.after !== undefined) options.after = expectation.after;
  const logs = testLogger.getLogs(options);
  const filtered = expectation.contains
    ? logs.filter((log) =>
        expectation.contains?.every((clause) =>
          typeof clause === 'string'
            ? log.message.includes(clause) || JSON.stringify(log.context ?? {}).includes(clause)
            : clause.test(log.message)
        )
      )
    : logs;

  if (expectation.minimum !== undefined && filtered.length < expectation.minimum) {
    throw new Error(
      `Expected at least ${expectation.minimum} log(s) but found ${filtered.length} matching entries.`
    );
  }

  return filtered;
}

// Default export for backward compatibility
export default TestLoggerWrapper;
