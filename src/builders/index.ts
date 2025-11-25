/**
 * Framework-agnostic test data builders
 */

/**
 * Builder pattern for creating test data
 */
export class Builder<T> {
  private data: Partial<T> = {};

  constructor(defaults?: Partial<T>) {
    if (defaults) {
      this.data = { ...defaults };
    }
  }

  /**
   * Set a property value
   */
  set<K extends keyof T>(key: K, value: T[K]): this {
    this.data[key] = value;
    return this;
  }

  /**
   * Set multiple properties
   */
  setMany(values: Partial<T>): this {
    Object.assign(this.data, values);
    return this;
  }

  /**
   * Build the final object
   */
  build(): T {
    return { ...this.data } as T;
  }

  /**
   * Build multiple objects
   */
  buildMany(count: number, customizer?: (index: number) => Partial<T>): T[] {
    return Array.from({ length: count }, (_, index) => {
      const builder = new Builder<T>({ ...this.data });
      if (customizer) {
        builder.setMany(customizer(index));
      }
      return builder.build();
    });
  }
}

/**
 * Create a builder for a type
 */
export function createBuilder<T>(defaults?: Partial<T>): Builder<T> {
  return new Builder<T>(defaults);
}

/**
 * Sequence generator for unique values
 */
export class Sequence {
  private current: number;

  constructor(start = 1) {
    this.current = start;
  }

  next(): number {
    return this.current++;
  }

  reset(value = 1): void {
    this.current = value;
  }
}

/**
 * Factory for creating test objects
 */
export class Factory<T> {
  private readonly sequence = new Sequence();

  constructor(private readonly builder: (seq: number) => T) {}

  /**
   * Create a single object
   */
  create(overrides?: Partial<T>): T {
    const obj = this.builder(this.sequence.next());
    return overrides ? { ...obj, ...overrides } : obj;
  }

  /**
   * Create multiple objects
   */
  createMany(count: number, customizer?: (index: number) => Partial<T>): T[] {
    return Array.from({ length: count }, (_, index) => {
      const obj = this.builder(this.sequence.next());
      const custom = customizer?.(index);
      return custom ? { ...obj, ...custom } : obj;
    });
  }

  /**
   * Reset the sequence
   */
  reset(): void {
    this.sequence.reset();
  }
}

/**
 * Create a factory
 */
export function createFactory<T>(builder: (seq: number) => T): Factory<T> {
  return new Factory<T>(builder);
}

/**
 * Common test data generators
 */
export const Generators = {
  /**
   * Generate a random email
   */
  email: (prefix = 'user'): string => {
    const random = Math.random().toString(36).substring(7);
    return `${prefix}-${random}@example.com`;
  },

  /**
   * Generate a random UUID
   */
  uuid: (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  },

  /**
   * Generate a random string
   */
  string: (length = 10): string => {
    return Math.random()
      .toString(36)
      .substring(2, 2 + length);
  },

  /**
   * Generate a random number
   */
  number: (min = 0, max = 100): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  /**
   * Generate a random date
   */
  date: (start = new Date(2020, 0, 1), end = new Date()): Date => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  },

  /**
   * Generate a random boolean
   */
  boolean: (): boolean => {
    return Math.random() < 0.5;
  },

  /**
   * Pick a random item from an array
   */
  pick: <T>(items: T[]): T => {
    if (items.length === 0) {
      throw new Error('Cannot pick from an empty array');
    }
    const index = Math.floor(Math.random() * items.length);
    const item = items[index];
    if (item === undefined) {
      throw new Error('Failed to pick item from array');
    }
    return item;
  },
};
