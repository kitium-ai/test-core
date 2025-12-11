/**
 * Data generation and factory utilities
 */

export type Generator<T> = (seed?: number) => T;
export type PartialFactory<T> = (overrides?: Partial<T>) => T;

/**
 * Random selection helper (DRY)
 */
const pickRandom = <T>(items: readonly T[]): T => {
  if (items.length === 0) {
    throw new Error('Cannot pick a value from an empty collection');
  }
  const index = Math.floor(Math.random() * items.length);
  const item = items[index];
  if (item === undefined) {
    throw new Error('Failed to pick item from collection');
  }
  return item;
};

/**
 * Generate random item from predefined list (DRY)
 */
const pickFromList = <T>(items: readonly T[]) => (): T => pickRandom(items);

/**
 * Create a factory for generating test data
 */
export function createFactory<T>(defaultFactory: (seed: number) => T): PartialFactory<T> {
  let seed = 1;

  return (overrides?: Partial<T>): T => {
    const data = defaultFactory(seed++);
    return { ...data, ...overrides };
  };
}

/**
 * Create a factory with relationship builder
 */
export function createFactoryWithBuilder<T>(
  defaultFactory: (seed: number) => T,
  relations?: Record<string, (seed: number) => unknown>
) {
  let seed = 1;

  return (overrides?: Partial<T> & Record<string, unknown>): T => {
    const data = defaultFactory(seed);
    const relationData = relations
      ? Object.entries(relations).reduce(
          (accumulator, [key, gen]) => {
            accumulator[key] = gen(seed);
            return accumulator;
          },
          {} as Record<string, unknown>
        )
      : {};

    seed++;
    return { ...data, ...relationData, ...overrides } as T;
  };
}

/**
 * Built-in data generators
 */
export const DataGenerators = {
  /**
   * Generate a random string
   */
  string(
    length = 10,
    charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  ): string {
    let result = '';
    for (let index = 0; index < length; index++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  },

  /**
   * Generate a random number within range
   */
  number(min = 0, max = 100): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  /**
   * Generate a random email
   */
  email(): string {
    return `${this.string(8)}@${this.string(6)}.com`;
  },

  /**
   * Generate a random UUID
   */
  uuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  },

  /**
   * Generate a random boolean
   */
  boolean(): boolean {
    return Math.random() > 0.5;
  },

  /**
   * Generate a random date
   */
  date(start = new Date(2020, 0, 1), end = new Date()): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  },

  /**
   * Generate a random phone number
   */
  phoneNumber(): string {
    return `+1${this.number(2000000000, 9999999999)}`;
  },

  /**
   * Generate a random user name
   */
  username(): string {
    const adjectives = ['quick', 'lazy', 'sleepy', 'noisy', 'hungry', 'angry'] as const;
    const nouns = ['fox', 'dog', 'cat', 'bear', 'lion', 'tiger'] as const;
    const adj = pickFromList(adjectives)();
    const noun = pickFromList(nouns)();
    const randomNumber = this.number(1, 999);
    return `${adj}_${noun}_${randomNumber}`;
  },

  /**
   * Generate a random URL
   */
  url(): string {
    const protocols = ['http', 'https'] as const;
    const domains = ['example.com', 'test.com', 'demo.com', 'sample.io'] as const;
    const protocol = pickFromList(protocols)();
    const domain = pickFromList(domains)();
    const path = this.string(8);
    return `${protocol}://${domain}/${path}`;
  },

  /**
   * Generate a random array
   */
  array<T>(generator: () => T, length = 3): T[] {
    return Array.from({ length }, () => generator());
  },

  /**
   * Generate a random object with specified keys
   */
  object<T extends Record<string, unknown>>(generators: {
    [K in keyof T]: () => T[K];
  }): T {
    const result: Record<string, unknown> = {};
    for (const key in generators) {
      if (Object.prototype.hasOwnProperty.call(generators, key)) {
        result[key] = generators[key]();
      }
    }
    return result as T;
  },

  /**
   * Generate a first name
   */
  firstName(): string {
    const names = [
      'John',
      'Jane',
      'Alice',
      'Bob',
      'Charlie',
      'Diana',
      'Eve',
      'Frank',
      'Grace',
      'Henry',
    ] as const;
    return pickFromList(names)();
  },

  /**
   * Generate a last name
   */
  lastName(): string {
    const names = [
      'Smith',
      'Johnson',
      'Williams',
      'Brown',
      'Jones',
      'Garcia',
      'Miller',
      'Davis',
      'Rodriguez',
      'Martinez',
    ] as const;
    return pickFromList(names)();
  },

  /**
   * Generate a full name
   */
  fullName(): string {
    return `${this.firstName()} ${this.lastName()}`;
  },

  /**
   * Generate a company name
   */
  companyName(): string {
    const prefixes = ['Tech', 'Data', 'Cloud', 'Digital', 'Smart', 'Next'] as const;
    const suffixes = ['Systems', 'Solutions', 'Services', 'Labs', 'Hub', 'AI'] as const;
    const prefix = pickFromList(prefixes)();
    const suffix = pickFromList(suffixes)();
    return `${prefix}${suffix}`;
  },

  /**
   * Generate a street address
   */
  address(): string {
    return `${this.number(1, 9999)} ${this.string(6)} Street`;
  },

  /**
   * Generate a city
   */
  city(): string {
    const cities = [
      'New York',
      'Los Angeles',
      'Chicago',
      'Houston',
      'Phoenix',
      'Philadelphia',
      'San Antonio',
      'San Diego',
    ] as const;
    return pickFromList(cities)();
  },

  /**
   * Generate a country
   */
  country(): string {
    const countries = [
      'USA',
      'Canada',
      'UK',
      'Germany',
      'France',
      'Japan',
      'Australia',
      'Brazil',
    ] as const;
    return pickFromList(countries)();
  },

  /**
   * Generate a ZIP code
   */
  zipCode(): string {
    return String(this.number(10000, 99999));
  },

  /**
   * Generate an IP address
   */
  ipAddress(): string {
    return `${this.number(1, 255)}.${this.number(0, 255)}.${this.number(0, 255)}.${this.number(1, 255)}`;
  },

  /**
   * Generate a credit card number (masked for safety)
   */
  creditCardNumber(): string {
    const digits = Array.from({ length: 16 }, () => this.number(0, 9)).join('');
    return `${digits.slice(0, 4)}-****-****-${digits.slice(-4)}`;
  },

  /**
   * Generate a slug
   */
  slug(): string {
    const words = ['test', 'data', 'sample', 'example', 'demo'] as const;
    const word = pickFromList(words)();
    return `${word}-${this.number(1, 999)}`;
  },

  /**
   * Generate a locale (e.g., en-US)
   */
  locale(): string {
    const locales = ['en-US', 'en-GB', 'fr-FR', 'de-DE', 'es-ES', 'ja-JP', 'zh-CN'] as const;
    return pickFromList(locales)();
  },

  /**
   * Generate an ISO timestamp
   */
  isoTimestamp(): string {
    return this.date().toISOString();
  },

  /**
   * Generate a past date (0-30 days ago)
   */
  pastDate(daysAgo = 30): Date {
    const now = new Date();
    const past = new Date(now.getTime() - Math.random() * daysAgo * 24 * 60 * 60 * 1000);
    return past;
  },

  /**
   * Generate a future date (0-30 days from now)
   */
  futureDate(daysFromNow = 30): Date {
    const now = new Date();
    const future = new Date(now.getTime() + Math.random() * daysFromNow * 24 * 60 * 60 * 1000);
    return future;
  },

  /**
   * Generate enum value from array
   */
  enum<T>(values: readonly T[]): T {
    return pickFromList(values)();
  },

  /**
   * Generate a weighted choice from options
   */
  weighted<T>(options: Array<{ value: T; weight: number }>): T {
    if (options.length === 0) {
      throw new Error('Weighted options cannot be empty');
    }

    const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);
    let random = Math.random() * totalWeight;

    for (const option of options) {
      random -= option.weight;
      if (random <= 0) {
        return option.value;
      }
    }

    const fallback = options[options.length - 1];
    if (fallback === undefined) {
      throw new Error('No options provided for weighted selection');
    }
    return fallback.value;
  },

  /**
   * Generate hex color
   */
  hexColor(): string {
    return (
      '#' +
      Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, '0')
    );
  },

  /**
   * Generate JSON object
   */
  json<T>(depth = 2): T {
    if (depth <= 0) {
      const typeFns = [
        () => this.string(),
        () => this.number(),
        () => this.boolean(),
        () => null,
      ] as const;
      const typeFunction = pickFromList(typeFns)();
      return typeFunction() as T;
    }

    const keys = Array.from({ length: this.number(2, 4) }, () => this.string(5));
    const result: Record<string, unknown> = {};

    for (const key of keys) {
      result[key] = this.json(depth - 1);
    }

    return result as T;
  },
};

/**
 * Common factory builders
 */
export const Factories = {
  /**
   * User factory
   */
  user: createFactory<{
    id: string;
    email: string;
    username: string;
    name: string;
    createdAt: Date;
  }>((seed) => ({
    id: DataGenerators.uuid(),
    email: `user${seed}@example.com`,
    username: `user_${seed}`,
    name: DataGenerators.fullName(),
    createdAt: new Date(),
  })),

  /**
   * Post factory
   */
  post: createFactory<{
    id: string;
    title: string;
    content: string;
    authorId: string;
    createdAt: Date;
  }>((seed) => ({
    id: DataGenerators.uuid(),
    title: `Post ${seed}`,
    content: `Content for post ${seed}`,
    authorId: DataGenerators.uuid(),
    createdAt: new Date(),
  })),

  /**
   * Comment factory
   */
  comment: createFactory<{
    id: string;
    text: string;
    authorId: string;
    postId: string;
    createdAt: Date;
  }>((seed) => ({
    id: DataGenerators.uuid(),
    text: `Comment ${seed}`,
    authorId: DataGenerators.uuid(),
    postId: DataGenerators.uuid(),
    createdAt: new Date(),
  })),

  /**
   * API response factory
   */
  apiResponse: createFactory<{ status: number; data: unknown; timestamp: string }>((seed) => ({
    status: 200,
    data: { id: seed },
    timestamp: new Date().toISOString(),
  })),

  /**
   * Company factory
   */
  company: createFactory<{
    id: string;
    name: string;
    email: string;
    address: string;
    city: string;
    country: string;
    createdAt: Date;
  }>((seed) => ({
    id: DataGenerators.uuid(),
    name: DataGenerators.companyName(),
    email: `contact${seed}@${DataGenerators.companyName().toLowerCase().replace(/\s+/g, '')}.com`,
    address: DataGenerators.address(),
    city: DataGenerators.city(),
    country: DataGenerators.country(),
    createdAt: new Date(),
  })),

  /**
   * Product factory
   */
  product: createFactory<{
    id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    createdAt: Date;
  }>((seed) => ({
    id: DataGenerators.uuid(),
    name: `Product ${seed}`,
    description: `Description for product ${seed}`,
    price: DataGenerators.number(10, 1000),
    stock: DataGenerators.number(0, 100),
    createdAt: new Date(),
  })),

  /**
   * Order factory
   */
  order: createFactory<{
    id: string;
    userId: string;
    total: number;
    status: string;
    createdAt: Date;
  }>((_seed) => ({
    id: DataGenerators.uuid(),
    userId: DataGenerators.uuid(),
    total: DataGenerators.number(50, 5000),
    status: DataGenerators.enum(['pending', 'processing', 'shipped', 'delivered']),
    createdAt: new Date(),
  })),

  /**
   * Todo factory
   */
  todo: createFactory<{
    id: string;
    title: string;
    completed: boolean;
    userId: string;
    createdAt: Date;
  }>((seed) => ({
    id: DataGenerators.uuid(),
    title: `Todo ${seed}`,
    completed: DataGenerators.boolean(),
    userId: DataGenerators.uuid(),
    createdAt: new Date(),
  })),

  /**
   * Article factory
   */
  article: createFactory<{
    id: string;
    title: string;
    slug: string;
    content: string;
    authorId: string;
    published: boolean;
    publishedAt: Date | null;
    createdAt: Date;
  }>((seed) => ({
    id: DataGenerators.uuid(),
    title: `Article ${seed}`,
    slug: DataGenerators.slug(),
    content: `Content for article ${seed}`.repeat(10),
    authorId: DataGenerators.uuid(),
    published: DataGenerators.boolean(),
    publishedAt: DataGenerators.boolean() ? new Date() : null,
    createdAt: new Date(),
  })),

  /**
   * Profile factory
   */
  profile: createFactory<{
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    bio: string;
    avatar: string;
    location: string;
    updatedAt: Date;
  }>((seed) => ({
    id: DataGenerators.uuid(),
    userId: DataGenerators.uuid(),
    firstName: DataGenerators.firstName(),
    lastName: DataGenerators.lastName(),
    bio: `Bio for user ${seed}`,
    avatar: `https://avatar.example.com/${seed}.jpg`,
    location: `${DataGenerators.city()}, ${DataGenerators.country()}`,
    updatedAt: new Date(),
  })),
};
