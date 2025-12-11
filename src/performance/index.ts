/**
 * Performance testing utilities for load testing, stress testing, and benchmarking
 * Inspired by Netflix's chaos engineering and Google's load testing frameworks
 */

import { assertUnreachable } from '../utils/assert-never';

export type LoadTestScenario = () => Promise<void> | void;

export type LoadTestOptions = {
  /** Test scenario to execute */
  scenario: LoadTestScenario;
  /** Test duration (e.g., '5m', '30s', '1h') */
  duration: string;
  /** Number of concurrent users */
  concurrency: number;
  /** Ramp-up time (e.g., '30s', '1m') */
  rampUp?: string;
  /** Ramp-down time */
  rampDown?: string;
  /** Target requests per second (optional) */
  targetRps?: number;
};

export type LoadTestResult = {
  /** Total duration in milliseconds */
  duration: number;
  /** Total requests executed */
  totalRequests: number;
  /** Successful requests */
  successfulRequests: number;
  /** Failed requests */
  failedRequests: number;
  /** Average response time in milliseconds */
  averageResponseTime: number;
  /** 95th percentile response time */
  p95ResponseTime: number;
  /** 99th percentile response time */
  p99ResponseTime: number;
  /** Requests per second */
  rps: number;
  /** Error rate as percentage */
  errorRate: number;
  /** Response time distribution */
  responseTimeDistribution: Array<{ range: string; count: number; percentage: number }>;
};

export type StressTestOptions = {
  /** Test scenario to execute */
  scenario: LoadTestScenario;
  /** Starting concurrency */
  startConcurrency: number;
  /** Maximum concurrency */
  maxConcurrency: number;
  /** Increment step */
  step: number;
  /** Duration at each concurrency level */
  durationPerStep: string;
  /** Stop when error rate exceeds this percentage */
  maxErrorRate?: number;
};

export type StressTestResult = {
  /** Results for each concurrency level */
  results: Array<{
    concurrency: number;
    result: LoadTestResult;
    passed: boolean;
  }>;
  /** Breaking point concurrency */
  breakingPoint?: number;
  /** Maximum sustainable concurrency */
  maxSustainableConcurrency: number;
};

export type BenchmarkOptions = {
  /** Function to benchmark */
  fn: () => Promise<unknown> | unknown;
  /** Number of iterations */
  iterations?: number;
  /** Warmup iterations */
  warmupIterations?: number;
  /** Timeout per iteration in milliseconds */
  timeout?: number;
};

export type BenchmarkResult = {
  /** Average execution time in milliseconds */
  averageTime: number;
  /** Median execution time */
  medianTime: number;
  /** Minimum execution time */
  minTime: number;
  /** Maximum execution time */
  maxTime: number;
  /** Standard deviation */
  stdDev: number;
  /** 95th percentile */
  p95Time: number;
  /** 99th percentile */
  p99Time: number;
  /** Total iterations completed */
  iterations: number;
  /** Operations per second */
  opsPerSecond: number;
};

/**
 * Parse duration string (e.g., '5m', '30s', '1h') to milliseconds
 */
function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid duration format: ${duration}. Use format like '5m', '30s', '1h'`);
  }

  const value = parseInt(match[1]!, 10);
  const unit = match[2];
  if (!unit) {
    throw new Error('Duration unit is required');
  }
  type DurationUnit = 's' | 'm' | 'h' | 'd';
  const normalizedUnit = unit as DurationUnit;

  switch (normalizedUnit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      assertUnreachable(normalizedUnit);
  }
}

/**
 * Calculate percentiles from response times
 */
function calculatePercentile(times: number[], percentile: number): number {
  if (times.length === 0) {
    return 0;
  }

  const sorted = [...times].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))] ?? 0;
}

/**
 * Create response time distribution
 */
function createResponseTimeDistribution(
  times: number[]
): Array<{ range: string; count: number; percentage: number }> {
  if (times.length === 0) {
    return [];
  }

  const sorted = [...times].sort((a, b) => a - b);
  if (sorted.length === 0) {
    return [];
  }

  const min = sorted[0]!;
  const max = sorted[sorted.length - 1]!;

  // Create 10 buckets
  const bucketSize = (max - min) / 10;
  const buckets: Array<{ range: string; count: number; percentage: number }> = [];

  for (let index = 0; index < 10; index++) {
    const bucketMin = min + index * bucketSize;
    const bucketMax = min + (index + 1) * bucketSize;
    const count = times.filter((t) => t >= bucketMin && t < bucketMax).length;
    const percentage = (count / times.length) * 100;

    buckets.push({
      range: `${bucketMin.toFixed(0)}-${bucketMax.toFixed(0)}ms`,
      count,
      percentage,
    });
  }

  return buckets;
}

/**
 * Run a load test with specified parameters
 */
export async function loadTest(options: LoadTestOptions): Promise<LoadTestResult> {
  const { scenario, duration, concurrency, rampUp = '0s', targetRps } = options;

  const durationMs = parseDuration(duration);
  const rampUpMs = parseDuration(rampUp);

  const startTime = Date.now();
  const endTime = startTime + durationMs;

  const results: Array<{ success: boolean; responseTime: number; error?: Error }> = [];
  const activePromises = new Set<Promise<void>>();

  // Calculate target RPS distribution
  const totalTargetRequests = targetRps ? Math.floor(targetRps * (durationMs / 1000)) : Infinity;

  let totalRequests = 0;

  // Ramp-up phase

  async function executeScenario(): Promise<void> {
    const scenarioStart = Date.now();

    try {
      await scenario();
      const responseTime = Date.now() - scenarioStart;
      results.push({ success: true, responseTime });
    } catch (error) {
      const responseTime = Date.now() - scenarioStart;
      results.push({
        success: false,
        responseTime,
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  // Main test execution
  const testPromise = new Promise<void>((resolve) => {
    const interval = setInterval(() => {
      const now = Date.now();

      if (now >= endTime) {
        clearInterval(interval);
        resolve();
        return;
      }

      // Check if we've hit the target number of requests
      if (totalRequests >= totalTargetRequests) {
        clearInterval(interval);
        resolve();
        return;
      }

      // Calculate current concurrency based on ramp-up
      let currentConcurrency = concurrency;
      if (rampUpMs > 0 && now - startTime < rampUpMs) {
        const rampProgress = (now - startTime) / rampUpMs;
        currentConcurrency = Math.floor(concurrency * rampProgress);
        currentConcurrency = Math.max(1, currentConcurrency);
      }

      // Limit active promises to current concurrency
      if (activePromises.size < currentConcurrency) {
        const promise = executeScenario();
        activePromises.add(promise);

        void promise.finally(() => {
          activePromises.delete(promise);
        });

        totalRequests++;
      }
    }, 10); // Check every 10ms
  });

  await testPromise;

  // Wait for all remaining promises to complete
  await Promise.allSettled(activePromises);

  // Calculate results
  const successfulRequests = results.filter((r) => r.success).length;
  const failedRequests = results.filter((r) => !r.success).length;
  const responseTimes = results.map((r) => r.responseTime);

  const averageResponseTime =
    responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  const p95ResponseTime = calculatePercentile(responseTimes, 95);
  const p99ResponseTime = calculatePercentile(responseTimes, 99);

  const actualDuration = Date.now() - startTime;
  const rps = (totalRequests / actualDuration) * 1000;
  const errorRate = (failedRequests / totalRequests) * 100;

  return {
    duration: actualDuration,
    totalRequests,
    successfulRequests,
    failedRequests,
    averageResponseTime,
    p95ResponseTime,
    p99ResponseTime,
    rps,
    errorRate,
    responseTimeDistribution: createResponseTimeDistribution(responseTimes),
  };
}

/**
 * Run a stress test that gradually increases concurrency
 */
export async function stressTest(options: StressTestOptions): Promise<StressTestResult> {
  const {
    scenario,
    startConcurrency,
    maxConcurrency,
    step,
    durationPerStep,
    maxErrorRate = 5,
  } = options;

  const results: Array<{
    concurrency: number;
    result: LoadTestResult;
    passed: boolean;
  }> = [];

  let breakingPoint: number | undefined;
  let maxSustainableConcurrency = startConcurrency;

  for (let concurrency = startConcurrency; concurrency <= maxConcurrency; concurrency += step) {
    const result = await loadTest({
      scenario,
      duration: durationPerStep,
      concurrency,
    });

    const passed = result.errorRate <= maxErrorRate;
    results.push({ concurrency, result, passed });

    if (passed) {
      maxSustainableConcurrency = concurrency;
    } else if (!breakingPoint) {
      breakingPoint = concurrency;
    }
  }

  return {
    results,
    ...(breakingPoint !== undefined && { breakingPoint }),
    maxSustainableConcurrency,
  };
}

/**
 * Benchmark a function's performance
 */
export async function benchmark(
  _name: string,
  options: BenchmarkOptions
): Promise<BenchmarkResult> {
  const { fn, iterations = 100, warmupIterations = 10, timeout = 30000 } = options;

  // Warmup phase
  for (let index = 0; index < warmupIterations; index++) {
    await Promise.race([
      fn(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Warmup timeout')), timeout)),
    ]);
  }

  // Benchmark phase
  const times: number[] = [];
  const startTime = performance.now();

  for (let index = 0; index < iterations; index++) {
    const iterationStart = performance.now();

    try {
      await Promise.race([
        fn(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Iteration timeout')), timeout)
        ),
      ]);

      const iterationTime = performance.now() - iterationStart;
      times.push(iterationTime);
    } catch (_error) {
      // Skip failed iterations
      continue;
    }
  }

  const totalTime = performance.now() - startTime;

  if (times.length === 0) {
    throw new Error('No successful iterations completed');
  }

  const sortedTimes = [...times].sort((a, b) => a - b);

  const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
  const medianTime = sortedTimes[Math.floor(sortedTimes.length / 2)];
  const minTime = sortedTimes[0];
  const maxTime = sortedTimes[sortedTimes.length - 1];

  // Calculate standard deviation
  const variance = times.reduce((sum, time) => sum + (time - averageTime) ** 2, 0) / times.length;
  const standardDeviation = Math.sqrt(variance);

  const p95Time = calculatePercentile(times, 95);
  const p99Time = calculatePercentile(times, 99);
  const opsPerSecond = (times.length / totalTime) * 1000;

  return {
    averageTime,
    medianTime: medianTime ?? 0,
    minTime: minTime ?? 0,
    maxTime: maxTime ?? 0,
    stdDev: standardDeviation,
    p95Time,
    p99Time,
    iterations: times.length,
    opsPerSecond,
  };
}

/**
 * Convenience function for quick benchmarking
 */
export async function benchmarkFn<T>(
  function_: () => T | Promise<T>,
  options?: Partial<BenchmarkOptions>
): Promise<BenchmarkResult> {
  return benchmark('anonymous', { fn: function_, ...options });
}
