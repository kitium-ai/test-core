/**
 * Framework-agnostic async test utilities
 */

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  options: {
    timeout?: number;
    interval?: number;
    timeoutMessage?: string;
  } = {}
): Promise<void> {
  const {
    timeout = 5000,
    interval = 50,
    timeoutMessage = 'Timeout waiting for condition',
  } = options;

  const startTime = Date.now();

  while (true) {
    const result = await condition();
    if (result) {
      return;
    }

    if (Date.now() - startTime > timeout) {
      throw new Error(timeoutMessage);
    }

    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

/**
 * Wait for a value to match a predicate
 */
export async function waitForValue<T>(
  getValue: () => T | Promise<T>,
  predicate: (value: T) => boolean,
  options: {
    timeout?: number;
    interval?: number;
  } = {}
): Promise<T> {
  const { timeout = 5000, interval = 50 } = options;

  const startTime = Date.now();

  while (true) {
    const value = await getValue();
    if (predicate(value)) {
      return value;
    }

    if (Date.now() - startTime > timeout) {
      throw new Error(`Timeout waiting for value. Last value: ${JSON.stringify(value)}`);
    }

    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

/**
 * Retry an async operation
 */
export async function retry<T>(
  operation: () => T | Promise<T>,
  options: {
    maxAttempts?: number;
    delay?: number;
    backoff?: number;
  } = {}
): Promise<T> {
  const { maxAttempts = 3, delay = 100, backoff = 2 } = options;

  let lastError: Error | undefined;
  let currentDelay = delay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, currentDelay));
        currentDelay *= backoff;
      }
    }
  }

  throw lastError ?? new Error('Retry failed');
}

/**
 * Run async operations in parallel with a limit
 */
export async function parallelLimit<T, R = unknown>(
  items: T[],
  limit: number,
  operation: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  const executing: Array<Promise<R>> = [];

  // Helper function to wrap operation and handle cleanup
  const executeWithCleanup = async (
    item: T,
    promiseReference: { current?: Promise<R> }
  ): Promise<R> => {
    try {
      const result = await operation(item);
      results.push(result);
      return result;
    } finally {
      if (promiseReference.current) {
        const index = executing.indexOf(promiseReference.current);
        if (index > -1) {
          void executing.splice(index, 1);
        }
      }
    }
  };

  for (const item of items) {
    const promiseReference: { current?: Promise<R> } = {};
    const promise = executeWithCleanup(item, promiseReference);
    promiseReference.current = promise;

    executing.push(promise);

    if (executing.length >= limit) {
      await Promise.race(executing);
    }
  }

  if (executing.length > 0) {
    await Promise.all(executing);
  }
  return results;
}

/**
 * Create a deferred promise
 */
export type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
};

export function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });

  return { promise, resolve, reject };
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
