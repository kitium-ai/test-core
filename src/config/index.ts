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

/**
 * Type coercion utilities (DRY - Extracted for reuse)
 */
class TypeCoercer {
  static toBoolean(value: unknown, fallback: boolean): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return fallback;
  }

  static toNumber(value: unknown, fallback: number, options?: { minimum?: number }): number {
    const numericValue = typeof value === 'string' ? Number.parseInt(value, 10) : (value as number);
    if (Number.isNaN(numericValue) || typeof numericValue !== 'number') {
      return fallback;
    }
    if (options?.minimum !== undefined && numericValue < options.minimum) {
      return fallback;
    }
    return numericValue;
  }
}

// Legacy exports for backward compatibility
const coerceBoolean = TypeCoercer.toBoolean.bind(TypeCoercer);
const coerceNumber = TypeCoercer.toNumber.bind(TypeCoercer);

/**
 * Environment loader (SRP - Separated from ConfigManager)
 */
class EnvironmentLoader {
  static loadOverrides(): Partial<TestConfig> {
    const environment = process.env;
    const overrides: Partial<TestConfig> = {};

    const environmentMappings: Array<{ envKey: string; configKey: keyof TestConfig }> = [
      { envKey: 'TEST_TIMEOUT', configKey: 'timeout' },
      { envKey: 'TEST_RETRIES', configKey: 'retries' },
      { envKey: 'TEST_VERBOSE', configKey: 'verbose' },
      { envKey: 'CI', configKey: 'ci' },
      { envKey: 'HEADLESS', configKey: 'headless' },
      { envKey: 'BASE_URL', configKey: 'baseUrl' },
      { envKey: 'API_URL', configKey: 'apiUrl' },
      { envKey: 'DATABASE_URL', configKey: 'dbUrl' },
    ];

    for (const { envKey, configKey } of environmentMappings) {
      if (environment[envKey] !== undefined) {
        overrides[configKey] = environment[envKey] as never;
      }
    }

    return overrides;
  }
}

class ConfigManager {
  private config: ResolvedTestConfig;

  constructor(initialConfig?: TestConfig) {
    this.config = this.buildConfig(initialConfig);
  }

  private buildConfig(initialConfig?: TestConfig): ResolvedTestConfig {
    const environmentOverrides = EnvironmentLoader.loadOverrides();
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

// Export class as named export (preferred)
export { ConfigManager };

// eslint-disable-next-line import/no-default-export
export default ConfigManager;
