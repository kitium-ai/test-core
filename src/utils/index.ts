/**
 * Common utility functions for testing
 * Note: Async utilities (retry, sleep, waitUntil, createDeferred) are in ./async/index.ts
 */

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }

  if (obj instanceof Array) {
    return obj.map((item) => deepClone(item)) as unknown as T;
  }

  if (obj instanceof Object) {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }

  return obj;
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
