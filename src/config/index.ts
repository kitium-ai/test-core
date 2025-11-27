/**
 * Configuration management for tests
 */

export type TestConfig = {
  timeout?: number | string;
  retries?: number | string;
  verbose?: boolean | string;
  ci?: boolean | string;
  headless?: boolean | string;
  baseUrl?: string;
  apiUrl?: string;
  dbUrl?: string;
  [key: string]: unknown;
};

export type ResolvedTestConfig = Readonly<
  {
    timeout: number;
    retries: number;
    verbose: boolean;
    ci: boolean;
    headless: boolean;
    baseUrl?: string;
    apiUrl?: string;
    dbUrl?: string;
  } & Record<string, unknown>
>;

const freezeDeep = <T>(value: T): Readonly<T> => {
  if (typeof value !== 'object' || value === null) {
    return value;
  }

  if (Array.isArray(value)) {
    return Object.freeze(value.map((item) => freezeDeep(item))) as Readonly<T>;
  }

  return Object.freeze(
    Object.entries(value).reduce((acc, [key, val]) => {
      acc[key as keyof T] = freezeDeep(val) as T[keyof T];
      return acc;
    }, {} as T)
  );
};

const defaultConfig: ResolvedTestConfig = freezeDeep({
  timeout: 30000,
  retries: 0,
  verbose: false,
  ci: false,
  headless: true,
});

const coerceBoolean = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return fallback;
};

const coerceNumber = (value: unknown, fallback: number, options?: { minimum?: number }): number => {
  const num = typeof value === 'string' ? Number.parseInt(value, 10) : (value as number);
  if (Number.isNaN(num) || typeof num !== 'number') return fallback;
  if (options?.minimum !== undefined && num < options.minimum) return fallback;
  return num;
};

class ConfigManager {
  private config: ResolvedTestConfig;

  constructor(initialConfig?: TestConfig) {
    this.config = this.buildConfig(initialConfig);
  }

  private buildConfig(initialConfig?: TestConfig): ResolvedTestConfig {
    const envOverrides = this.loadEnvironmentOverrides();
    const mergedInput: TestConfig = {
      ...initialConfig,
      ...envOverrides,
    };

    const coerced: ResolvedTestConfig = freezeDeep({
      ...mergedInput,
      timeout: coerceNumber(mergedInput.timeout, defaultConfig.timeout, { minimum: 1 }),
      retries: coerceNumber(mergedInput.retries, defaultConfig.retries, { minimum: 0 }),
      verbose: coerceBoolean(mergedInput.verbose, defaultConfig.verbose),
      ci: coerceBoolean(mergedInput.ci, defaultConfig.ci),
      headless: coerceBoolean(mergedInput.headless, defaultConfig.headless),
    });

    return coerced;
  }

  private loadEnvironmentOverrides(): Partial<TestConfig> {
    const env = process.env;

    return {
      timeout: env['TEST_TIMEOUT'],
      retries: env['TEST_RETRIES'],
      verbose: env['TEST_VERBOSE'],
      ci: env['CI'],
      headless: env['HEADLESS'],
      baseUrl: env['BASE_URL'],
      apiUrl: env['API_URL'],
      dbUrl: env['DATABASE_URL'],
    };
  }

  get<T extends keyof ResolvedTestConfig>(key: T): ResolvedTestConfig[T] {
    return this.config[key];
  }

  set<T extends keyof ResolvedTestConfig>(key: T, value: ResolvedTestConfig[T]): void {
    this.config = this.buildConfig({
      ...this.config,
      [key]: value,
    });
  }

  getAll(): ResolvedTestConfig {
    return this.config;
  }

  merge(partial: Partial<TestConfig>): void {
    this.config = this.buildConfig({
      ...this.config,
      ...partial,
    });
  }

  reset(): void {
    this.config = this.buildConfig();
  }
}

let instance: ConfigManager | null = null;

export const createConfigManager = (initialConfig?: TestConfig): ConfigManager =>
  new ConfigManager(initialConfig);

export const getConfigManager = (): ConfigManager => {
  instance ??= new ConfigManager();
  return instance;
};

export const resetConfig = (): void => {
  instance = null;
};

export default ConfigManager;
