/* eslint-disable space-before-function-paren */
/**
 * Framework-agnostic timer utilities for testing
 * These utilities work across Jest, Vitest, and other test frameworks
 */

/**
 * Timeout helper - reject promise after specified time
 * @param ms Timeout in milliseconds
 * @param message Optional error message
 * @returns Promise that rejects after timeout
 */
export function timeout<T>(ms: number, message?: string): Promise<T> {
  return new Promise((_resolve, reject) => {
    setTimeout(() => reject(new Error(message ?? `Operation timed out after ${ms}ms`)), ms);
  });
}

/**
 * Race a promise against a timeout
 * @param promise Promise to race
 * @param ms Timeout in milliseconds
 * @param message Optional timeout error message
 * @returns Promise that resolves with the first result or rejects on timeout
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, message?: string): Promise<T> {
  return Promise.race([promise, timeout<T>(ms, message)]);
}

/**
 * Debounce a function - delay execution until after wait period
 * @param fn Function to debounce
 * @param delayMs Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  function_: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      function_(...args);
      timeoutId = null;
    }, delayMs);
  };
}

/**
 * Throttle a function - limit execution to once per time period
 * @param fn Function to throttle
 * @param limitMs Minimum time between executions in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  function_: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      function_(...args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
      }, limitMs);
    }
  };
}

/**
 * Measure execution time of a function
 * @param fn Function to measure
 * @returns Object with result and duration in milliseconds
 */
export async function measureTime<T>(
  function_: () => T | Promise<T>
): Promise<{ result: T; duration: number }> {
  const startTime = performance.now();
  const result = await function_();
  const duration = performance.now() - startTime;

  return { result, duration };
}

/**
 * Assert that execution time is within bounds
 * @param fn Function to execute
 * @param minMs Minimum expected duration in milliseconds
 * @param maxMs Maximum expected duration in milliseconds
 * @returns Result of the function
 * @throws Error if execution time is outside bounds
 */
export async function assertExecutionTime<T>(
  function_: () => T | Promise<T>,
  minMs: number,
  maxMs: number
): Promise<T> {
  const { result, duration } = await measureTime(function_);

  if (duration < minMs || duration > maxMs) {
    throw new Error(`Execution time ${duration.toFixed(2)}ms not within range ${minMs}-${maxMs}ms`);
  }

  return result;
}

/**
 * Create a delayed version of a function
 * @param fn Function to delay
 * @param delayMs Delay in milliseconds
 * @returns Delayed function that returns a promise
 */
export function delayedFunction<T extends (...args: unknown[]) => unknown>(
  function_: T,
  delayMs: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return function_(...args) as ReturnType<T>;
  };
}
