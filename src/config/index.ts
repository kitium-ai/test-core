/**
 * Configuration management for tests
 */

export type TestConfig = {
  timeout?: number;
  retries?: number;
  verbose?: boolean;
  ci?: boolean;
  headless?: boolean;
  baseUrl?: string;
  apiUrl?: string;
  dbUrl?: string;
  [key: string]: unknown;
};

class ConfigManager {
  private config: TestConfig = {};
  private readonly defaults: TestConfig = {
    timeout: 30000,
    retries: 0,
    verbose: false,
    ci: false,
    headless: true,
  };

  constructor(initialConfig?: TestConfig) {
    this.config = {
      ...this.defaults,
      ...initialConfig,
    };
    this.loadEnvironmentVariables();
  }

  private loadEnvironmentVariables(): void {
    const env = process.env;

    const timeout = env['TEST_TIMEOUT'];
    if (timeout) {
      this.config.timeout = parseInt(timeout, 10);
    }

    const retries = env['TEST_RETRIES'];
    if (retries) {
      this.config.retries = parseInt(retries, 10);
    }

    if (env['CI']) {
      this.config.ci = true;
      this.config.headless = true;
    }

    const verbose = env['TEST_VERBOSE'];
    if (verbose) {
      this.config.verbose = verbose === 'true';
    }

    const baseUrl = env['BASE_URL'];
    if (baseUrl) {
      this.config.baseUrl = baseUrl;
    }

    const apiUrl = env['API_URL'];
    if (apiUrl) {
      this.config.apiUrl = apiUrl;
    }

    const databaseUrl = env['DATABASE_URL'];
    if (databaseUrl) {
      this.config.dbUrl = databaseUrl;
    }
  }

  get<T extends keyof TestConfig>(key: T): TestConfig[T] {
    return this.config[key];
  }

  set<T extends keyof TestConfig>(key: T, value: TestConfig[T]): void {
    this.config[key] = value;
  }

  getAll(): TestConfig {
    return { ...this.config };
  }

  merge(partial: Partial<TestConfig>): void {
    this.config = { ...this.config, ...partial };
  }

  reset(): void {
    this.config = { ...this.defaults };
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
