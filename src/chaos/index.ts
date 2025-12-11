/**
 * Chaos engineering utilities for failure injection and resilience testing
 * Inspired by Netflix's Simian Army and Google's chaos testing frameworks
 */

import { createLogger } from '../logger';
import { assertUnreachable } from '../utils/assert-never';

const chaosLogger = createLogger(undefined, { metadata: { module: 'chaos-testing' } });

export type FailureInjection = {
  /** Type of failure to inject */
  type: 'delay' | 'error' | 'timeout' | 'disconnect' | 'corruption';
  /** Target to apply failure to (service name, URL pattern, etc.) */
  target: string;
  /** Probability of failure (0-1) */
  probability: number;
  /** Duration of failure in milliseconds */
  duration?: number;
  /** Additional configuration */
  config?: Record<string, unknown>;
};

export type ChaosExperiment = {
  /** Experiment name */
  name: string;
  /** Experiment description */
  description?: string;
  /** Duration of experiment */
  duration: string;
  /** Failure injections to apply */
  injections: FailureInjection[];
  /** Services to monitor */
  monitors?: string[];
  /** Safety conditions - experiment stops if these are violated */
  safetyConditions?: Array<{
    metric: string;
    threshold: number;
    operator: '>' | '<' | '>=' | '<=' | '==';
  }>;
  /** Tags for categorization */
  tags?: string[];
};

export type ChaosExperimentResult = {
  /** Experiment that was run */
  experiment: ChaosExperiment;
  /** Whether experiment completed successfully */
  completed: boolean;
  /** Actual duration */
  actualDuration: number;
  /** Injections that were triggered */
  triggeredInjections: Array<{
    injection: FailureInjection;
    timestamp: string;
    target: string;
  }>;
  /** Safety violations that occurred */
  safetyViolations: Array<{
    condition: {
      metric: string;
      threshold: number;
      operator: '>' | '<' | '>=' | '<=' | '==';
    };
    value: number;
    timestamp: string;
  }>;
  /** Metrics collected during experiment */
  metrics: Record<string, Array<{ timestamp: string; value: number }>>;
  /** Errors that occurred */
  errors: Array<{ timestamp: string; error: string }>;
  /** Timestamp when experiment started */
  startTime: string;
  /** Timestamp when experiment ended */
  endTime: string;
};

export type NetworkChaosConfig = {
  /** Latency to add (in milliseconds) */
  latency?: number;
  /** Jitter for latency (in milliseconds) */
  jitter?: number;
  /** Packet loss percentage (0-100) */
  packetLoss?: number;
  /** Bandwidth limit (in Mbps) */
  bandwidthLimit?: number;
  /** Corruption percentage (0-100) */
  corruption?: number;
};

export type ServiceChaosConfig = {
  /** Service to target */
  service: string;
  /** Failure mode */
  failureMode: 'crash' | 'hang' | 'slow' | 'unresponsive';
  /** Duration of failure */
  duration?: number;
  /** Recovery time */
  recoveryTime?: number;
};

export type DatabaseChaosConfig = {
  /** Database operation to disrupt */
  operation: 'read' | 'write' | 'connect' | 'query';
  /** Failure mode */
  failureMode: 'timeout' | 'error' | 'slow' | 'disconnect';
  /** Duration */
  duration?: number;
  /** Error rate (0-1) */
  errorRate?: number;
};

/**
 * Chaos orchestrator for managing experiments
 */
export class ChaosOrchestrator {
  private readonly activeExperiments = new Map<string, ChaosExperimentResult>();
  private readonly failureInjections = new Map<string, FailureInjection>();

  /**
   * Register a failure injection
   */
  registerInjection(injection: FailureInjection): void {
    this.failureInjections.set(injection.target, injection);
  }

  /**
   * Unregister a failure injection
   */
  unregisterInjection(target: string): void {
    this.failureInjections.delete(target);
  }

  /**
   * Check if a failure should be injected for a target
   */
  shouldInjectFailure(target: string): FailureInjection | null {
    const injection = this.failureInjections.get(target);
    if (!injection) {
      return null;
    }

    if (Math.random() < injection.probability) {
      return injection;
    }

    return null;
  }

  /**
   * Run a chaos experiment
   */
  async runExperiment(experiment: ChaosExperiment): Promise<ChaosExperimentResult> {
    const startTime = new Date().toISOString();
    const experimentId = `${experiment.name}-${Date.now()}`;
    const result = this.createInitialResult(experiment, startTime);

    this.activeExperiments.set(experimentId, result);

    try {
      this.registerInjections(experiment);
      await this.runChaosLoop(experiment, result);
      result.completed = true;
    } catch (error) {
      result.errors.push({
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      this.cleanupExperiment(experiment, experimentId);
      result.endTime = new Date().toISOString();
      result.actualDuration = Date.now() - new Date(startTime).getTime();
    }

    return result;
  }

  private createInitialResult(
    experiment: ChaosExperiment,
    startTime: string
  ): ChaosExperimentResult {
    return {
      experiment,
      completed: false,
      actualDuration: 0,
      triggeredInjections: [],
      safetyViolations: [],
      metrics: {},
      errors: [],
      startTime,
      endTime: '',
    };
  }

  private registerInjections(experiment: ChaosExperiment): void {
    experiment.injections.forEach((injection) => {
      this.registerInjection(injection);
    });
  }

  private cleanupExperiment(experiment: ChaosExperiment, experimentId: string): void {
    experiment.injections.forEach((injection) => {
      this.unregisterInjection(injection.target);
    });
    this.activeExperiments.delete(experimentId);
  }

  private async runChaosLoop(
    experiment: ChaosExperiment,
    result: ChaosExperimentResult
  ): Promise<void> {
    const durationMs = parseDuration(experiment.duration);
    const endTime = Date.now() + durationMs;

    while (Date.now() < endTime) {
      if (experiment.safetyConditions) {
        await this.checkSafetyConditions(experiment.safetyConditions, result);
      }

      if (experiment.monitors) {
        await this.collectMetrics(experiment.monitors, result);
      }

      await sleep(100);
    }
  }

  private async checkSafetyConditions(
    conditions: NonNullable<ChaosExperiment['safetyConditions']>,
    result: ChaosExperimentResult
  ): Promise<void> {
    for (const condition of conditions) {
      const value = await this.getMetricValue(condition.metric);
      const violated = checkCondition(value, condition);

      if (violated) {
        result.safetyViolations.push({
          condition,
          value,
          timestamp: new Date().toISOString(),
        });

        throw new Error(
          `Safety condition violated: ${condition.metric} ${condition.operator} ${condition.threshold} (actual: ${value})`
        );
      }
    }
  }

  private async collectMetrics(monitors: string[], result: ChaosExperimentResult): Promise<void> {
    for (const metric of monitors) {
      const value = await this.getMetricValue(metric);
      result.metrics[metric] ??= [];
      result.metrics[metric].push({
        timestamp: new Date().toISOString(),
        value,
      });
    }
  }

  /**
   * Get metric value (mock implementation)
   */
  private async getMetricValue(metric: string): Promise<number> {
    await Promise.resolve(); // Simulate async check
    switch (metric) {
      case 'cpu_usage':
        return Math.random() * 100;
      case 'memory_usage':
        return Math.random() * 100;
      case 'error_rate':
        return Math.random() * 5;
      case 'response_time':
        return Math.random() * 1000 + 100;
      default:
        return Math.random() * 100;
    }
  }

  /**
   * Get active experiments
   */
  getActiveExperiments(): ChaosExperimentResult[] {
    return Array.from(this.activeExperiments.values());
  }

  /**
   * Stop experiment by name
   */
  stopExperiment(name: string): boolean {
    for (const [id, result] of this.activeExperiments.entries()) {
      if (result.experiment.name === name) {
        result.completed = false;
        result.endTime = new Date().toISOString();
        this.activeExperiments.delete(id);
        return true;
      }
    }
    return false;
  }
}

/**
 * Inject network chaos
 */
export async function injectNetworkChaos(
  config: NetworkChaosConfig,
  duration = '30s'
): Promise<void> {
  const durationMs = parseDuration(duration);

  // In real implementation, this would use system tools like tc (traffic control)
  // or proxy servers to inject network chaos
  chaosLogger.info('Injecting network chaos', {
    durationMs,
    latency: config.latency,
    packetLoss: config.packetLoss,
    bandwidthLimit: config.bandwidthLimit,
    corruption: config.corruption,
  });

  await sleep(durationMs);
}

/**
 * Inject service failure
 */
export async function injectServiceFailure(config: ServiceChaosConfig): Promise<void> {
  const duration = config.duration ?? 30000;

  // In real implementation, this would interact with service orchestration
  // systems like Kubernetes, Docker, or service meshes
  chaosLogger.info('Injecting service failure', {
    service: config.service,
    failureMode: config.failureMode,
  });

  await sleep(duration);
}

/**
 * Inject database chaos
 */
export async function injectDatabaseChaos(
  config: DatabaseChaosConfig,
  duration = '30s'
): Promise<void> {
  const durationMs = parseDuration(duration);

  // In real implementation, this would use database proxies or
  // orchestration tools to inject database failures
  chaosLogger.info('Injecting database chaos', {
    durationMs,
    operation: config.operation,
    failureMode: config.failureMode,
  });

  await sleep(durationMs);
}

/**
 * Simulate latency injection
 */
export const simulateLatency = <T extends (...args: unknown[]) => Promise<unknown>>(
  function_: T,
  latencyMs: number,
  jitterMs = 0
): T => {
  const wrapped = (async (...args: Parameters<T>) => {
    const actualLatency = latencyMs + (Math.random() - 0.5) * 2 * jitterMs;
    await sleep(actualLatency);
    return function_(...args);
  }) as T;
  return wrapped;
};

/**
 * Simulate error injection
 */
export const simulateError = <T extends (...args: unknown[]) => Promise<unknown>>(
  function_: T,
  errorRate: number,
  error: Error = new Error('Simulated chaos error')
): T => {
  const wrapped = (async (...args: Parameters<T>) => {
    if (Math.random() < errorRate) {
      throw error;
    }
    return function_(...args);
  }) as T;
  return wrapped;
};

/**
 * Simulate timeout injection
 */
export const simulateTimeout = <T extends (...args: unknown[]) => Promise<unknown>>(
  function_: T,
  timeoutMs: number,
  timeoutError: Error = new Error('Simulated timeout')
): T => {
  const wrapped = (async (...args: Parameters<T>) => {
    const timeoutPromise = new Promise<never>((_resolve, reject) => {
      setTimeout(() => reject(timeoutError), timeoutMs);
    });

    return Promise.race([function_(...args), timeoutPromise]);
  }) as T;
  return wrapped;
};

/**
 * Create a chaos monkey that randomly injects failures
 */
export class ChaosMonkey {
  private readonly orchestrator: ChaosOrchestrator;
  private isRunning = false;

  constructor(orchestrator?: ChaosOrchestrator) {
    this.orchestrator = orchestrator ?? new ChaosOrchestrator();
  }

  /**
   * Start chaos monkey with random failure injection
   */
  async startChaosMonkey(config: {
    targets: string[];
    maxFailuresPerMinute: number;
    failureTypes: Array<FailureInjection['type']>;
    duration?: string;
  }): Promise<void> {
    this.isRunning = true;
    const { targets, maxFailuresPerMinute, failureTypes, duration } = config;

    const endTime = duration ? Date.now() + parseDuration(duration) : Infinity;

    try {
      while (this.isRunning && Date.now() < endTime) {
        // Calculate delay between failures
        const failuresPerMs = maxFailuresPerMinute / (60 * 1000);
        const delay = Math.random() / failuresPerMs;

        await sleep(delay);

        // Randomly select target and failure type
        const target = targets[Math.floor(Math.random() * targets.length)];
        const failureType = failureTypes[Math.floor(Math.random() * failureTypes.length)];

        if (!target || !failureType) {
          continue;
        }

        // Create and register injection
        const injection: FailureInjection = {
          type: failureType,
          target,
          probability: 1, // Always trigger when selected
          duration: Math.random() * 10000 + 1000, // 1-11 seconds
        };

        this.orchestrator.registerInjection(injection);

        // Unregister after duration
        setTimeout(() => {
          this.orchestrator.unregisterInjection(target);
        }, injection.duration);
      }
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Stop chaos monkey
   */
  stopChaosMonkey(): void {
    this.isRunning = false;
  }

  /**
   * Get orchestrator
   */
  getOrchestrator(): ChaosOrchestrator {
    return this.orchestrator;
  }
}

/**
 * Generate chaos experiment report
 */
export function generateChaosReport(result: ChaosExperimentResult): string {
  const lines: string[] = [];

  lines.push(`# Chaos Experiment Report: ${result.experiment.name}`);
  lines.push('');
  if (result.experiment.description) {
    lines.push(`**Description**: ${result.experiment.description}`);
    lines.push('');
  }

  appendSummary(lines, result);
  appendSafetyViolations(lines, result);
  appendTriggeredInjections(lines, result);
  appendErrors(lines, result);
  appendMetrics(lines, result);

  return lines.join('\n');
}

function appendSummary(lines: string[], result: ChaosExperimentResult): void {
  lines.push(`## Summary`);
  lines.push(`- **Status**: ${result.completed ? '✅ COMPLETED' : '❌ FAILED'}`);
  lines.push(
    `- **Duration**: ${result.actualDuration}ms (expected: ${result.experiment.duration})`
  );
  lines.push(`- **Injections Triggered**: ${result.triggeredInjections.length}`);
  lines.push(`- **Safety Violations**: ${result.safetyViolations.length}`);
  lines.push(`- **Errors**: ${result.errors.length}`);
  lines.push(`- **Start Time**: ${result.startTime}`);
  lines.push(`- **End Time**: ${result.endTime}`);

  if (result.experiment.tags && result.experiment.tags.length > 0) {
    lines.push(`- **Tags**: ${result.experiment.tags.join(', ')}`);
  }
  lines.push('');
}

function appendSafetyViolations(lines: string[], result: ChaosExperimentResult): void {
  if (result.safetyViolations.length > 0) {
    lines.push('## Safety Violations');
    lines.push('');
    result.safetyViolations.forEach((violation, index) => {
      lines.push(
        `${index + 1}. **${violation.condition.metric}** ${violation.condition.operator} ${violation.condition.threshold} (actual: ${violation.value}) at ${violation.timestamp}`
      );
    });
    lines.push('');
  }
}

function appendTriggeredInjections(lines: string[], result: ChaosExperimentResult): void {
  if (result.triggeredInjections.length > 0) {
    lines.push('## Triggered Injections');
    lines.push('');
    result.triggeredInjections.forEach((injection, index) => {
      lines.push(
        `${index + 1}. **${injection.injection.type}** on ${injection.target} at ${injection.timestamp}`
      );
      if (injection.injection.duration) {
        lines.push(`   Duration: ${injection.injection.duration}ms`);
      }
    });
    lines.push('');
  }
}

function appendErrors(lines: string[], result: ChaosExperimentResult): void {
  if (result.errors.length > 0) {
    lines.push('## Errors');
    lines.push('');
    result.errors.forEach((error, index) => {
      lines.push(`${index + 1}. ${error.error} at ${error.timestamp}`);
    });
    lines.push('');
  }
}

function appendMetrics(lines: string[], result: ChaosExperimentResult): void {
  if (Object.keys(result.metrics).length > 0) {
    lines.push('## Metrics');
    lines.push('');
    Object.entries(result.metrics).forEach(([metric, values]) => {
      const avg = values.reduce((sum, v) => sum + v.value, 0) / values.length;
      const min = Math.min(...values.map((v) => v.value));
      const max = Math.max(...values.map((v) => v.value));

      lines.push(`### ${metric}`);
      lines.push(`- **Average**: ${avg.toFixed(2)}`);
      lines.push(`- **Min**: ${min.toFixed(2)}`);
      lines.push(`- **Max**: ${max.toFixed(2)}`);
      lines.push(`- **Samples**: ${values.length}`);
      lines.push('');
    });
  }
}

/**
 * Utility functions
 */
function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid duration format: ${duration}. Use format like '5m', '30s', '1h'`);
  }

  const value = parseInt(match[1] ?? '0', 10);
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
      return assertUnreachable(normalizedUnit);
  }
}

function checkCondition(
  value: number,
  condition: { metric: string; threshold: number; operator: '>' | '<' | '>=' | '<=' | '==' }
): boolean {
  switch (condition.operator) {
    case '>':
      return value > condition.threshold;
    case '<':
      return value < condition.threshold;
    case '>=':
      return value >= condition.threshold;
    case '<=':
      return value <= condition.threshold;
    case '==':
      return value === condition.threshold;
    default:
      return false;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
