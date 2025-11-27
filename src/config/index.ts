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
    return Object.freeze(value.map((item) => freezeDeep(item))) as unknown as Readonly<T>;
  }

  return Object.freeze(
    Object.entries(value).reduce((accumulator, [key, value_]) => {
      accumulator[key as keyof T] = freezeDeep(value_) as T[keyof T];
      return accumulator;
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
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return fallback;
};

const coerceNumber = (value: unknown, fallback: number, options?: { minimum?: number }): number => {
  const numericValue = typeof value === 'string' ? Number.parseInt(value, 10) : (value as number);
  if (Number.isNaN(numericValue) || typeof numericValue !== 'number') {
    return fallback;
  }
  if (options?.minimum !== undefined && numericValue < options.minimum) {
    return fallback;
  }
  return numericValue;
};

class ConfigManager {
  private config: ResolvedTestConfig;

  constructor(initialConfig?: TestConfig) {
    this.config = this.buildConfig(initialConfig);
  }

  private buildConfig(initialConfig?: TestConfig): ResolvedTestConfig {
    const environmentOverrides = this.loadEnvironmentOverrides();
    const mergedInput: TestConfig = {
      ...initialConfig,
      ...environmentOverrides,
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
    const environment = process.env;
    const overrides: Partial<TestConfig> = {};

    if (environment['TEST_TIMEOUT'] !== undefined) overrides.timeout = environment['TEST_TIMEOUT'];
    if (environment['TEST_RETRIES'] !== undefined) overrides.retries = environment['TEST_RETRIES'];
    if (environment['TEST_VERBOSE'] !== undefined) overrides.verbose = environment['TEST_VERBOSE'];
    if (environment['CI'] !== undefined) overrides.ci = environment['CI'];
    if (environment['HEADLESS'] !== undefined) overrides.headless = environment['HEADLESS'];
    if (environment['BASE_URL'] !== undefined) overrides.baseUrl = environment['BASE_URL'];
    if (environment['API_URL'] !== undefined) overrides.apiUrl = environment['API_URL'];
    if (environment['DATABASE_URL'] !== undefined) overrides.dbUrl = environment['DATABASE_URL'];

    return overrides;
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
