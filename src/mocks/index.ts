/* eslint-disable space-before-function-paren */
/**
 * Framework-agnostic mocking utilities
 * Can be used with Jest, Vitest, or any other test framework
 */

export type MockFunction<T extends (...args: unknown[]) => unknown> = T & {
  mockCalls: Array<Parameters<T>>;
  mockResults: Array<{ type: 'return' | 'throw'; value: unknown }>;
  mockClear: () => void;
  mockReset: () => void;
  mockImplementation: (implementation: T) => MockFunction<T>;
  mockReturnValue: (value: ReturnType<T>) => MockFunction<T>;
  mockResolvedValue: (value: Awaited<ReturnType<T>>) => MockFunction<T>;
  mockRejectedValue: (error: unknown) => MockFunction<T>;
};

/**
 * Create a mock function
 * Framework-agnostic - works with any test runner
 */
export function createMockFunction<T extends (...args: unknown[]) => unknown>(
  implementation?: T
): MockFunction<T> {
  const calls: Array<Parameters<T>> = [];
  const results: Array<{ type: 'return' | 'throw'; value: unknown }> = [];
  let currentImplementation = implementation;

  const mockFunction = ((...args: Parameters<T>): ReturnType<T> => {
    calls.push(args);

    try {
      const result = currentImplementation
        ? currentImplementation(...args)
        : (undefined as ReturnType<T>);
      results.push({ type: 'return', value: result });
      return result as ReturnType<T>;
    } catch (error) {
      results.push({ type: 'throw', value: error });
      throw error;
    }
  }) as MockFunction<T>;

  mockFunction.mockCalls = calls;
  mockFunction.mockResults = results;

  mockFunction.mockClear = () => {
    calls.length = 0;
    results.length = 0;
  };

  mockFunction.mockReset = () => {
    mockFunction.mockClear();
    currentImplementation = undefined as T | undefined;
  };

  mockFunction.mockImplementation = (impl: T) => {
    currentImplementation = impl;
    return mockFunction;
  };

  mockFunction.mockReturnValue = (value: ReturnType<T>) => {
    currentImplementation = (() => value) as T;
    return mockFunction;
  };

  mockFunction.mockResolvedValue = (value: Awaited<ReturnType<T>>) => {
    currentImplementation = (() => Promise.resolve(value)) as T;
    return mockFunction;
  };

  mockFunction.mockRejectedValue = (error: unknown) => {
    currentImplementation = (() => Promise.reject(error)) as T;
    return mockFunction;
  };

  return mockFunction;
}

/**
 * Create a mock object with all methods as mock functions
 */
export function createMockObject<T extends Record<string, unknown>>(
  methods: Array<keyof T>
): { [K in keyof T]: T[K] extends (...args: unknown[]) => unknown ? MockFunction<T[K]> : never } {
  type MockResult = {
    [K in keyof T]: T[K] extends (...args: unknown[]) => unknown ? MockFunction<T[K]> : never;
  };
  const mock = {} as Record<string, unknown>;

  for (const method of methods) {
    const methodKey = String(method);
    mock[methodKey] = createMockFunction();
  }

  return mock as MockResult;
}

/**
 * Spy on an object method
 */
export function spyOn<T extends Record<string, unknown>, K extends keyof T>(
  object: T,
  method: K
): T[K] extends (...args: unknown[]) => unknown ? MockFunction<T[K]> : never {
  const original = object[method];

  if (typeof original !== 'function') {
    throw new Error(`Cannot spy on non-function property: ${String(method)}`);
  }

  const spy = createMockFunction(
    original as T[K] extends (...args: unknown[]) => unknown ? T[K] : never
  );
  object[method] = spy as T[K];

  return spy as T[K] extends (...args: unknown[]) => unknown ? MockFunction<T[K]> : never;
}

/**
 * Restore a spied method
 */
export function restoreSpy<T extends Record<string, unknown>, K extends keyof T>(
  object: T,
  method: K,
  original: T[K]
): void {
  object[method] = original;
}
