/**
 * Test orchestration utilities for parallel execution, sharding, and test distribution
 * Inspired by Microsoft's Rush/Lage and Google's Bazel test execution
 */

export type TestSuite = {
  /** Suite name */
  name: string;
  /** Test files or patterns */
  files: string[];
  /** Environment variables */
  env?: Record<string, string>;
  /** Setup commands to run before suite */
  setup?: string[];
  /** Teardown commands to run after suite */
  teardown?: string[];
  /** Dependencies - other suites that must run first */
  dependencies?: string[];
  /** Tags for filtering */
  tags?: string[];
  /** Timeout in milliseconds */
  timeout?: number;
  /** Retry configuration */
  retry?: {
    attempts: number;
    delay: number;
  };
};

export type TestShard = {
  /** Shard index */
  index: number;
  /** Total number of shards */
  total: number;
  /** Test files assigned to this shard */
  files: string[];
  /** Environment variables for this shard */
  env?: Record<string, string>;
};

export type OrchestrationOptions = {
  /** Number of parallel workers */
  concurrency?: number;
  /** Enable sharding */
  sharding?: boolean;
  /** Number of shards */
  shardCount?: number;
  /** Shard index to run (0-based) */
  shardIndex?: number;
  /** Test patterns to include */
  include?: string[];
  /** Test patterns to exclude */
  exclude?: string[];
  /** Tags to include */
  tags?: string[];
  /** Tags to exclude */
  excludeTags?: string[];
  /** Fail fast - stop on first failure */
  failFast?: boolean;
  /** Continue on error */
  continueOnError?: boolean;
  /** Timeout for entire orchestration */
  timeout?: number;
  /** Output format */
  outputFormat?: 'json' | 'tap' | 'junit' | 'console';
  /** Report file path */
  reportPath?: string;
  /** Cache directory */
  cacheDir?: string;
  /** Enable caching */
  enableCache?: boolean;
};

export type TestResult = {
  /** Test suite name */
  suite: string;
  /** Test file path */
  file: string;
  /** Test name */
  name: string;
  /** Whether the test passed */
  passed: boolean;
  /** Execution time in milliseconds */
  duration: number;
  /** Error message if failed */
  error?: string;
  /** Stack trace if failed */
  stackTrace?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
};

export type OrchestrationResult = {
  /** Whether orchestration completed successfully */
  success: boolean;
  /** Total execution time */
  totalDuration: number;
  /** Results for each test */
  results: TestResult[];
  /** Summary statistics */
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
  };
  /** Sharding information */
  sharding?: {
    shardIndex: number;
    totalShards: number;
    shardFiles: string[];
  };
  /** Errors that occurred during orchestration */
  errors: Array<{ message: string; timestamp: string }>;
  /** Cache statistics */
  cacheStats?: {
    hits: number;
    misses: number;
    savedTime: number;
  };
  /** Timestamp */
  timestamp: string;
};

/**
 * Test orchestrator for managing parallel test execution
 */
export class TestOrchestrator {
  private readonly suites = new Map<string, TestSuite>();
  private readonly cache = new Map<string, { result: TestResult; timestamp: number }>();

  /**
   * Register a test suite
   */
  registerSuite(suite: TestSuite): void {
    this.suites.set(suite.name, suite);
  }

  /**
   * Get registered suites
   */
  getSuites(): TestSuite[] {
    return Array.from(this.suites.values());
  }

  /**
   * Get suite by name
   */
  getSuite(name: string): TestSuite | undefined {
    return this.suites.get(name);
  }

  /**
   * Resolve suite dependencies in topological order
   */
  resolveDependencies(suiteNames: string[]): string[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const order: string[] = [];

    const visit = (name: string): void => {
      if (visited.has(name)) {
        return;
      }
      if (visiting.has(name)) {
        throw new Error(`Circular dependency detected: ${name}`);
      }

      visiting.add(name);

      const suite = this.suites.get(name);
      if (suite?.dependencies) {
        for (const dep of suite.dependencies) {
          visit(dep);
        }
      }

      visiting.delete(name);
      visited.add(name);
      order.push(name);
    };

    for (const name of suiteNames) {
      visit(name);
    }

    return order;
  }

  /**
   * Shard test files across multiple workers
   */
  createShards(files: string[], shardCount: number): TestShard[] {
    const shards: TestShard[] = [];

    for (let index = 0; index < shardCount; index++) {
      shards.push({
        index: index,
        total: shardCount,
        files: [],
        env: {
          TEST_SHARD_INDEX: index.toString(),
          TEST_TOTAL_SHARDS: shardCount.toString(),
        },
      });
    }

    // Distribute files across shards
    files.forEach((file, index) => {
      const shardIndex = index % shardCount;
      shards[shardIndex]?.files.push(file);
    });

    return shards;
  }

  /**
   * Filter test files based on patterns and tags
   */
  filterTests(
    suites: TestSuite[],
    options: {
      include?: string[];
      exclude?: string[];
      tags?: string[];
      excludeTags?: string[];
    }
  ): TestSuite[] {
    const { include, exclude, tags, excludeTags } = options;

    return suites
      .filter((suite) => {
        // Filter by tags
        if (tags && suite.tags) {
          const hasMatchingTag = tags.some((tag) => suite.tags!.includes(tag));
          if (!hasMatchingTag) {
            return false;
          }
        }

        if (excludeTags && suite.tags) {
          const hasExcludedTag = excludeTags.some((tag) => suite.tags!.includes(tag));
          if (hasExcludedTag) {
            return false;
          }
        }

        return true;
      })
      .map((suite) => ({
        ...suite,
        files: suite.files.filter((file) => {
          // Include patterns
          if (include) {
            const matchesInclude = include.some((pattern) => matchesPattern(file, pattern));
            if (!matchesInclude) {
              return false;
            }
          }

          // Exclude patterns
          if (exclude) {
            const matchesExclude = exclude.some((pattern) => matchesPattern(file, pattern));
            if (matchesExclude) {
              return false;
            }
          }

          return true;
        }),
      }))
      .filter((suite) => suite.files.length > 0);
  }

  /**
   * Orchestrate test execution
   */
  async orchestrate(
    suiteNames: string[],
    options: OrchestrationOptions = {}
  ): Promise<OrchestrationResult> {
    const startTime = Date.now();
    const {
      concurrency = 4,
      sharding = false,
      shardCount = 4,
      shardIndex,
      continueOnError = true,
      enableCache = false,
    } = options;

    const result: OrchestrationResult = {
      success: false,
      totalDuration: 0,
      results: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0,
      },
      errors: [],
      timestamp: new Date().toISOString(),
    };

    try {
      // Resolve dependencies
      const orderedSuites = this.resolveDependencies(suiteNames);

      // Get and filter suites
      const suites = orderedSuites
        .map((name) => this.suites.get(name))
        .filter((suite): suite is TestSuite => suite !== undefined);

      const filteredSuites = this.filterTests(suites, options);

      // Collect all test files
      let allFiles: string[] = [];
      filteredSuites.forEach((suite) => {
        allFiles.push(...suite.files);
      });

      // Apply sharding if enabled
      if (sharding) {
        const shards = this.createShards(allFiles, shardCount);
        const targetShard = shardIndex !== undefined ? shards[shardIndex] : shards[0];

        if (targetShard) {
          allFiles = targetShard.files;
          result.sharding = {
            shardIndex: targetShard.index,
            totalShards: targetShard.total,
            shardFiles: targetShard.files,
          };
        }
      }

      // Execute tests in parallel with concurrency limit
      const semaphore = new Semaphore(concurrency);
      const testPromises: Array<Promise<TestResult[]>> = [];

      for (const suite of filteredSuites) {
        for (const file of suite.files) {
          if (!allFiles.includes(file)) {
            continue;
          }

          const promise = semaphore.acquire().then(async (release) => {
            try {
              const suiteResults = await this.runTestSuite(suite, file, options);
              return suiteResults;
            } finally {
              release();
            }
          });

          testPromises.push(promise);
        }
      }

      // Wait for all tests to complete
      const allResults = await Promise.allSettled(testPromises);
      const successfulResults = allResults
        .filter((r): r is PromiseFulfilledResult<TestResult[]> => r.status === 'fulfilled')
        .flatMap((r) => r.value);

      const failedPromises = allResults
        .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
        .map((r) => r.reason);

      // Collect results
      result.results = successfulResults;

      // Handle failures
      if (failedPromises.length > 0) {
        failedPromises.forEach((error) => {
          result.errors.push({
            message: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString(),
          });
        });

        if (!continueOnError) {
          throw new Error(`Test orchestration failed: ${failedPromises.length} suites failed`);
        }
      }

      // Calculate summary
      result.summary.total = result.results.length;
      result.summary.passed = result.results.filter((r) => r.passed).length;
      result.summary.failed = result.results.filter((r) => !r.passed).length;
      result.summary.duration = Date.now() - startTime;

      result.success = result.summary.failed === 0;
      result.totalDuration = result.summary.duration;

      // Cache statistics (simplified)
      if (enableCache) {
        result.cacheStats = {
          hits: 0,
          misses: result.summary.total,
          savedTime: 0,
        };
      }
    } catch (error) {
      result.errors.push({
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
    }

    return result;
  }

  /**
   * Run a single test suite (mock implementation)
   */
  private async runTestSuite(
    suite: TestSuite,
    file: string,
    options: OrchestrationOptions
  ): Promise<TestResult[]> {
    // In real implementation, this would execute the actual test runner
    // For now, return mock results

    const startTime = Date.now();

    // Simulate test execution time
    await sleep(Math.random() * 1000 + 100);

    const duration = Date.now() - startTime;
    const passed = Math.random() > 0.1; // 90% pass rate

    const result: TestResult = {
      suite: suite.name,
      file,
      name: `Test in ${file}`,
      passed,
      duration,
      ...(passed ? {} : { error: 'Mock test failure' }),
      metadata: {
        shard: options.sharding ? 'mock-shard' : undefined,
      },
    };

    return [result];
  }

  /**
   * Clear test cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hits: number; misses: number } {
    return {
      size: this.cache.size,
      hits: 0, // Would track in real implementation
      misses: 0,
    };
  }
}

/**
 * Semaphore for controlling concurrency
 */
class Semaphore {
  private permits: number;
  private readonly waiting: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      if (this.permits > 0) {
        this.permits--;
        resolve(() => this.release());
      } else {
        this.waiting.push(() => {
          this.permits--;
          resolve(() => this.release());
        });
      }
    });
  }

  private release(): void {
    this.permits++;
    if (this.waiting.length > 0) {
      const next = this.waiting.shift();
      if (next) {
        next();
      }
    }
  }
}

/**
 * Quarantine failing tests to prevent CI disruption
 */
export class TestQuarantine {
  private readonly quarantinedTests = new Set<string>();

  /**
   * Add test to quarantine
   */
  quarantine(testId: string): void {
    this.quarantinedTests.add(testId);
  }

  /**
   * Remove test from quarantine
   */
  unquarantine(testId: string): void {
    this.quarantinedTests.delete(testId);
  }

  /**
   * Check if test is quarantined
   */
  isQuarantined(testId: string): boolean {
    return this.quarantinedTests.has(testId);
  }

  /**
   * Get all quarantined tests
   */
  getQuarantinedTests(): string[] {
    return Array.from(this.quarantinedTests);
  }

  /**
   * Clear quarantine
   */
  clear(): void {
    this.quarantinedTests.clear();
  }
}

/**
 * Generate orchestration report
 */
export function generateOrchestrationReport(result: OrchestrationResult): string {
  const lines: string[] = [];

  lines.push('# Test Orchestration Report');
  lines.push('');
  lines.push('## Summary');
  lines.push(`- **Status**: ${result.success ? '✅ PASSED' : '❌ FAILED'}`);
  lines.push(`- **Total Tests**: ${result.summary.total}`);
  lines.push(`- **Passed**: ${result.summary.passed}`);
  lines.push(`- **Failed**: ${result.summary.failed}`);
  lines.push(`- **Skipped**: ${result.summary.skipped}`);
  lines.push(`- **Duration**: ${result.summary.duration}ms`);
  lines.push(`- **Timestamp**: ${result.timestamp}`);

  if (result.sharding) {
    lines.push(`- **Shard**: ${result.sharding.shardIndex + 1}/${result.sharding.totalShards}`);
    lines.push(`- **Shard Files**: ${result.sharding.shardFiles.length}`);
  }

  if (result.cacheStats) {
    lines.push(`- **Cache Hits**: ${result.cacheStats.hits}`);
    lines.push(`- **Cache Misses**: ${result.cacheStats.misses}`);
    lines.push(`- **Time Saved**: ${result.cacheStats.savedTime}ms`);
  }

  lines.push('');

  if (result.errors.length > 0) {
    lines.push('## Errors');
    lines.push('');
    result.errors.forEach((error, index) => {
      lines.push(`${index + 1}. ${error.message} (${error.timestamp})`);
    });
    lines.push('');
  }

  if (result.summary.failed > 0) {
    lines.push('## Failed Tests');
    lines.push('');
    result.results
      .filter((r) => !r.passed)
      .forEach((testResult, index) => {
        lines.push(`### ${index + 1}. ${testResult.suite} > ${testResult.file}`);
        lines.push(`- **Test**: ${testResult.name}`);
        lines.push(`- **Duration**: ${testResult.duration}ms`);
        if (testResult.error) {
          lines.push(`- **Error**: ${testResult.error}`);
        }
        lines.push('');
      });
  }

  return lines.join('\n');
}

/**
 * Utility functions
 */
function matchesPattern(file: string, pattern: string): boolean {
  // Simple glob matching - in real implementation, use a proper glob library
  if (pattern.includes('*')) {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(file);
  }
  return file.includes(pattern);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Convenience function for quick orchestration
 */
export async function orchestrateTests(
  suites: TestSuite[],
  options?: OrchestrationOptions
): Promise<OrchestrationResult> {
  const orchestrator = new TestOrchestrator();

  suites.forEach((suite) => orchestrator.registerSuite(suite));

  const suiteNames = suites.map((s) => s.name);
  return orchestrator.orchestrate(suiteNames, options);
}

/**
 * Convenience function for sharding
 */
export function shardTests(
  files: string[],
  shardCount: number,
  shardIndex: number
): TestShard | null {
  const orchestrator = new TestOrchestrator();
  const shards = orchestrator.createShards(files, shardCount);
  return shards[shardIndex] || null;
}

/**
 * Convenience function for quarantining
 */
export function quarantineTests(
  results: TestResult[],
  quarantine: TestQuarantine,
  failureThreshold = 3
): void {
  const failures = new Map<string, number>();

  // Count failures per test
  results.forEach((result) => {
    if (!result.passed) {
      const key = `${result.suite}:${result.file}:${result.name}`;
      failures.set(key, (failures.get(key) || 0) + 1);
    }
  });

  // Quarantine tests that fail repeatedly
  failures.forEach((count, testId) => {
    if (count >= failureThreshold) {
      quarantine.quarantine(testId);
    }
  });
}
