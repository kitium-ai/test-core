/**
 * Common utility functions for testing
 * Note: Async utilities (retry, sleep, waitUntil, createDeferred) are in ./async/index.ts
 */

/**
 * Deep clone an object
 */
export function deepClone<T>(object: T): T {
  if (object === null || typeof object !== 'object') {
    return object;
  }

  if (object instanceof Date) {
    return new Date(object.getTime()) as unknown as T;
  }

  if (object instanceof Array) {
    return object.map((item) => deepClone(item)) as unknown as T;
  }

  if (object instanceof Object) {
    const clonedObject = {} as T;
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        clonedObject[key] = deepClone(object[key]);
      }
    }
    return clonedObject;
  }

  return object;
}

/**
 * Merge two objects deeply
 */
export function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const result = { ...target } as Record<string, unknown>;

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = result[key];

      if (
        typeof sourceValue === 'object' &&
        sourceValue !== null &&
        typeof targetValue === 'object' &&
        targetValue !== null &&
        !Array.isArray(sourceValue) &&
        !Array.isArray(targetValue)
      ) {
        result[key] = deepMerge(targetValue as object, sourceValue as object);
      } else {
        result[key] = sourceValue;
      }
    }
  }

  return result as T;
}

/**
 * Sanitize data for logging (removes sensitive info)
 * Uses @kitiumai/logger's sanitizeData function
 */
import { sanitizeData } from '@kitiumai/logger';

export function sanitizeForLogging(
  data: unknown,
  sensitiveKeys: string[] = ['password', 'token', 'secret', 'apiKey', 'authorization']
): unknown {
  return sanitizeData(data, sensitiveKeys);
}
