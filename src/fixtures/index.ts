/**
 * Framework-agnostic fixture management
 * Provides lifecycle management for test fixtures
 */

export type FixtureSetup<T> = () => T | Promise<T>;
export type FixtureTeardown<T> = (value: T) => void | Promise<void>;

export type Fixture<T> = {
  setup: FixtureSetup<T>;
  teardown?: FixtureTeardown<T>;
};

/**
 * Fixture manager for managing test fixtures
 */
export class FixtureManager {
  private readonly fixtures: Map<
    string,
    { value: unknown; teardown?: (value: unknown) => void | Promise<void> }
  > = new Map();
  private setupOrder: string[] = [];

  /**
   * Register a fixture
   */
  register<T>(name: string, fixture: Fixture<T>): void {
    if (this.fixtures.has(name)) {
      throw new Error(`Fixture '${name}' is already registered`);
    }

    const fixtureEntry: {
      value: unknown;
      teardown?: (value: unknown) => void | Promise<void>;
    } = {
      value: null,
    };

    if (fixture.teardown) {
      fixtureEntry.teardown = fixture.teardown as (value: unknown) => void | Promise<void>;
    }

    this.fixtures.set(name, fixtureEntry);
  }

  /**
   * Setup a fixture
   */
  async setup<T>(name: string, setupFunction: FixtureSetup<T>): Promise<T> {
    if (!this.fixtures.has(name)) {
      this.register(name, { setup: setupFunction });
    }

    const fixture = this.fixtures.get(name);
    if (!fixture) {
      throw new Error(`Fixture '${name}' not found`);
    }
    if (fixture.value !== null) {
      return fixture.value as T;
    }

    const value = await setupFunction();
    fixture.value = value;
    this.setupOrder.push(name);

    return value;
  }

  /**
   * Get a fixture value
   */
  get<T>(name: string): T {
    const fixture = this.fixtures.get(name);
    if (!fixture) {
      throw new Error(`Fixture '${name}' not found`);
    }

    if (fixture.value === null) {
      throw new Error(`Fixture '${name}' has not been set up`);
    }

    return fixture.value as T;
  }

  /**
   * Teardown a specific fixture
   */
  async teardown(name: string): Promise<void> {
    const fixture = this.fixtures.get(name);
    if (!fixture) {
      return;
    }

    if (fixture.teardown && fixture.value !== null) {
      await fixture.teardown(fixture.value);
    }

    fixture.value = null;
    const index = this.setupOrder.indexOf(name);
    if (index > -1) {
      this.setupOrder.splice(index, 1);
    }
  }

  /**
   * Teardown all fixtures in reverse order
   */
  async teardownAll(): Promise<void> {
    // Teardown in reverse order of setup
    for (let index = this.setupOrder.length - 1; index >= 0; index--) {
      const name = this.setupOrder[index];
      if (name) {
        await this.teardown(name);
      }
    }
  }

  /**
   * Clear all fixtures
   */
  clear(): void {
    this.fixtures.clear();
    this.setupOrder = [];
  }
}

/**
 * Create a global fixture manager
 */
let globalFixtureManager: FixtureManager | null = null;

export function getGlobalFixtureManager(): FixtureManager {
  globalFixtureManager ??= new FixtureManager();
  return globalFixtureManager;
}

/**
 * Reset global fixture manager
 */
export function resetGlobalFixtureManager(): void {
  globalFixtureManager = null;
}

/**
 * Convenience function to create a fixture
 */
export function createFixture<T>(
  setup: FixtureSetup<T>,
  teardown?: FixtureTeardown<T>
): Fixture<T> {
  return teardown ? { setup, teardown } : { setup };
}
