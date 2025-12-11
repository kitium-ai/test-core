/**
 * Test analytics and insights utilities for test metrics, failure analysis, and predictive analytics
 * Inspired by Meta's test insights and Google's test analytics
 */

export type TestMetrics = {
  /** Test suite name */
  suite: string;
  /** Test file path */
  file: string;
  /** Test name */
  name: string;
  /** Execution time in milliseconds */
  duration: number;
  /** Whether the test passed */
  passed: boolean;
  /** Timestamp of execution */
  timestamp: string;
  /** Environment information */
  environment?: {
    nodeVersion?: string;
    os?: string;
    ci?: boolean;
  };
  /** Flakiness score (0-1, higher means more flaky) */
  flakinessScore?: number;
  /** Categories/tags */
  tags?: string[];
};

export type TestAnalyticsResult = {
  /** Overall test health score (0-100) */
  healthScore: number;
  /** Total tests analyzed */
  totalTests: number;
  /** Test counts by status */
  counts: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
  /** Performance metrics */
  performance: {
    averageDuration: number;
    medianDuration: number | undefined;
    p95Duration: number;
    slowestTests: Array<{ name: string; duration: number }>;
    fastestTests: Array<{ name: string; duration: number }>;
  };
  /** Reliability metrics */
  reliability: {
    passRate: number;
    failureRate: number;
    flakyTests: Array<{ name: string; flakinessScore: number; failureRate: number }>;
    mostFailingTests: Array<{ name: string; failureCount: number; failureRate: number }>;
  };
  /** Trends over time */
  trends: {
    passRateTrend: Array<{ date: string | undefined; passRate: number }>;
    durationTrend: Array<{ date: string | undefined; averageDuration: number }>;
    failureTrend: Array<{ date: string | undefined; failureCount: number }>;
  };
  /** Recommendations for improvement */
  recommendations: Array<{
    type: 'performance' | 'reliability' | 'flakiness' | 'coverage';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    suggestion: string;
  }>;
  /** Analysis timestamp */
  timestamp: string;
};

export type FlakinessAnalysis = {
  /** Test identifier */
  testId: string;
  /** Flakiness score (0-1) */
  flakinessScore: number;
  /** Number of runs analyzed */
  runsAnalyzed: number;
  /** Pass/fail pattern */
  pattern: Array<'pass' | 'fail'>;
  /** Failure rate */
  failureRate: number;
  /** Confidence in flakiness assessment */
  confidence: number;
  /** Recommended actions */
  recommendations: string[];
};

export type PredictiveFailure = {
  /** Test that might fail */
  testId: string;
  /** Probability of failure (0-1) */
  probability: number;
  /** Reasons for prediction */
  reasons: string[];
  /** Confidence in prediction */
  confidence: number;
  /** Suggested actions */
  actions: string[];
};

export type TestInsights = {
  /** Flakiness analysis for all tests */
  flakinessAnalysis: FlakinessAnalysis[];
  /** Predictive failure analysis */
  predictiveFailures: PredictiveFailure[];
  /** Performance bottlenecks */
  performanceBottlenecks: Array<{
    testId: string;
    averageDuration: number;
    impact: 'high' | 'medium' | 'low';
    suggestion: string;
  }>;
  /** Test coverage gaps */
  coverageGaps: Array<{
    file: string;
    coverage: number;
    uncoveredLines: number[];
    suggestion: string;
  }>;
  /** Environment-specific issues */
  environmentIssues: Array<{
    environment: string;
    issue: string;
    affectedTests: string[];
    severity: 'high' | 'medium' | 'low';
  }>;
};

/**
 * Test analytics collector and analyzer
 */
export class TestAnalytics {
  private metrics: TestMetrics[] = [];
  private readonly historicalData = new Map<string, TestMetrics[]>();

  /**
   * Record test metrics
   */
  recordMetrics(metrics: TestMetrics): void {
    this.metrics.push(metrics);

    // Store in historical data
    const key = `${metrics.suite}:${metrics.file}:${metrics.name}`;
    if (!this.historicalData.has(key)) {
      this.historicalData.set(key, []);
    }
    const data = this.historicalData.get(key);
    if (data) {
      data.push(metrics);
    }
  }

  /**
   * Record multiple test metrics
   */
  recordMultipleMetrics(metrics: TestMetrics[]): void {
    metrics.forEach((metric) => this.recordMetrics(metric));
  }

  /**
   * Analyze performance metrics
   */
  private analyzePerformance(): TestAnalyticsResult['performance'] {
    const durations = this.metrics.map((m) => m.duration);
    const sortedDurations = [...durations].sort((a, b) => a - b);

    return {
      averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      medianDuration: sortedDurations[Math.floor(sortedDurations.length / 2)],
      p95Duration: calculatePercentile(sortedDurations, 95),
      slowestTests: this.metrics
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 10)
        .map((m) => ({ name: `${m.suite}:${m.file}:${m.name}`, duration: m.duration })),
      fastestTests: this.metrics
        .filter((m) => m.passed)
        .sort((a, b) => a.duration - b.duration)
        .slice(0, 10)
        .map((m) => ({ name: `${m.suite}:${m.file}:${m.name}`, duration: m.duration })),
    };
  }

  /**
   * Analyze reliability metrics
   */
  private analyzeReliability(
    passedTests: TestMetrics[],
    failedTests: TestMetrics[]
  ): TestAnalyticsResult['reliability'] {
    const passRate = passedTests.length / this.metrics.length;
    const failureRate = failedTests.length / this.metrics.length;

    const testFailureCounts = new Map<string, number>();
    failedTests.forEach((test) => {
      const key = `${test.suite}:${test.file}:${test.name}`;
      testFailureCounts.set(key, (testFailureCounts.get(key) ?? 0) + 1);
    });

    return {
      passRate,
      failureRate,
      flakyTests: this.analyzeFlakiness(),
      mostFailingTests: Array.from(testFailureCounts.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([name, count]) => ({
          name,
          failureCount: count,
          failureRate: count / this.metrics.length,
        })),
    };
  }

  /**
   * Analyze test data and generate insights
   */
  analyze(): TestAnalyticsResult {
    if (this.metrics.length === 0) {
      return this.createEmptyResult();
    }

    const passedTests = this.metrics.filter((m) => m.passed);
    const failedTests = this.metrics.filter((m) => !m.passed);

    // Performance analysis
    const performance = this.analyzePerformance();

    // Reliability analysis
    const reliability = this.analyzeReliability(passedTests, failedTests);

    // Trends (simplified - would use historical data in real implementation)
    const trends = {
      passRateTrend: [
        { date: new Date().toISOString().split('T')[0], passRate: reliability.passRate },
      ],
      durationTrend: [
        {
          date: new Date().toISOString().split('T')[0],
          averageDuration: performance.averageDuration,
        },
      ],
      failureTrend: [
        { date: new Date().toISOString().split('T')[0], failureCount: failedTests.length },
      ],
    };

    // Health score calculation
    const healthScore = calculateHealthScore(
      reliability.passRate,
      performance.p95Duration,
      reliability.flakyTests.length
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      performance,
      reliability,
      reliability.passRate
    );

    return {
      healthScore,
      totalTests: this.metrics.length,
      counts: {
        total: this.metrics.length,
        passed: passedTests.length,
        failed: failedTests.length,
        skipped: 0, // Not tracking skipped tests in this implementation
      },
      performance,
      reliability,
      trends,
      recommendations,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Analyze test flakiness
   */
  analyzeFlakiness(): Array<{ name: string; flakinessScore: number; failureRate: number }> {
    const flakinessResults: Array<{ name: string; flakinessScore: number; failureRate: number }> =
      [];

    for (const [testId, testMetrics] of this.historicalData.entries()) {
      if (testMetrics.length < 5) {
        continue;
      } // Need minimum runs for flakiness analysis

      const passedRuns = testMetrics.filter((m) => m.passed).length;
      const totalRuns = testMetrics.length;
      const failureRate = (totalRuns - passedRuns) / totalRuns;

      // Calculate flakiness score based on pass/fail pattern
      let flakinessScore = 0;
      for (let index = 1; index < testMetrics.length; index++) {
        if (testMetrics[index]?.passed !== testMetrics[index - 1]?.passed) {
          flakinessScore += 0.1; // Increase score for each alternation
        }
      }
      flakinessScore = Math.min(1, flakinessScore);

      // Also factor in failure rate
      flakinessScore = Math.max(flakinessScore, failureRate * 0.5);

      if (flakinessScore > 0.3) {
        // Only include potentially flaky tests
        flakinessResults.push({
          name: testId,
          flakinessScore,
          failureRate,
        });
      }
    }

    return flakinessResults.sort((a, b) => b.flakinessScore - a.flakinessScore);
  }

  /**
   * Generate predictive failure analysis
   */
  predictFailures(): PredictiveFailure[] {
    const predictions: PredictiveFailure[] = [];

    for (const [testId, testMetrics] of this.historicalData.entries()) {
      if (testMetrics.length < 10) {
        continue;
      }

      // Simple prediction based on recent failure patterns
      const recentRuns = testMetrics.slice(-5);
      const recentFailures = recentRuns.filter((m) => !m.passed).length;
      const failureRate = recentFailures / recentRuns.length;

      if (failureRate > 0.6) {
        predictions.push({
          testId,
          probability: Math.min(0.9, failureRate),
          reasons: [
            `Recent failure rate: ${(failureRate * 100).toFixed(1)}%`,
            'Test has been failing consistently',
          ],
          confidence: 0.8,
          actions: [
            'Investigate test implementation',
            'Check for environmental dependencies',
            'Consider quarantining the test',
          ],
        });
      }
    }

    return predictions.sort((a, b) => b.probability - a.probability);
  }

  /**
   * Generate comprehensive test insights
   */
  generateInsights(): TestInsights {
    return {
      flakinessAnalysis: this.analyzeFlakiness().map((f) => ({
        testId: f.name,
        flakinessScore: f.flakinessScore,
        runsAnalyzed: this.historicalData.get(f.name)?.length ?? 0,
        pattern: this.historicalData.get(f.name)?.map((m) => (m.passed ? 'pass' : 'fail')) ?? [],
        failureRate: f.failureRate,
        confidence: 0.8, // Simplified
        recommendations: [
          'Run test in isolation',
          'Check for race conditions',
          'Review test dependencies',
        ],
      })),
      predictiveFailures: this.predictFailures(),
      performanceBottlenecks: [], // Would analyze performance data
      coverageGaps: [], // Would integrate with coverage tools
      environmentIssues: [], // Would analyze environment-specific failures
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.historicalData.clear();
  }

  /**
   * Get metrics for a specific test
   */
  getTestMetrics(testId: string): TestMetrics[] {
    return this.historicalData.get(testId) ?? [];
  }

  /**
   * Export metrics for persistence
   */
  exportMetrics(): TestMetrics[] {
    return [...this.metrics];
  }

  /**
   * Import metrics from persistence
   */
  importMetrics(metrics: TestMetrics[]): void {
    this.recordMultipleMetrics(metrics);
  }

  private createEmptyResult(): TestAnalyticsResult {
    return {
      healthScore: 0,
      totalTests: 0,
      counts: { total: 0, passed: 0, failed: 0, skipped: 0 },
      performance: {
        averageDuration: 0,
        medianDuration: 0,
        p95Duration: 0,
        slowestTests: [],
        fastestTests: [],
      },
      reliability: {
        passRate: 0,
        failureRate: 0,
        flakyTests: [],
        mostFailingTests: [],
      },
      trends: {
        passRateTrend: [],
        durationTrend: [],
        failureTrend: [],
      },
      recommendations: [],
      timestamp: new Date().toISOString(),
    };
  }

  private generateRecommendations(
    performance: TestAnalyticsResult['performance'],
    reliability: TestAnalyticsResult['reliability'],
    passRate: number
  ): TestAnalyticsResult['recommendations'] {
    const recommendations: TestAnalyticsResult['recommendations'] = [];

    // Performance recommendations
    if (performance.p95Duration > 5000) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        title: 'Slow Test Performance',
        description: `95th percentile test duration is ${performance.p95Duration}ms`,
        suggestion: 'Optimize slow tests, consider parallel execution, review async operations',
      });
    }

    // Reliability recommendations
    if (reliability.failureRate > 0.1) {
      recommendations.push({
        type: 'reliability',
        priority: 'high',
        title: 'High Test Failure Rate',
        description: `Test failure rate is ${(reliability.failureRate * 100).toFixed(1)}%`,
        suggestion:
          'Investigate failing tests, check for environmental issues, review test stability',
      });
    }

    if (reliability.flakyTests.length > 0) {
      recommendations.push({
        type: 'flakiness',
        priority: 'medium',
        title: 'Flaky Tests Detected',
        description: `${reliability.flakyTests.length} tests show flaky behavior`,
        suggestion: 'Isolate flaky tests, check for race conditions, improve test determinism',
      });
    }

    // Overall health
    if (passRate < 0.8) {
      recommendations.push({
        type: 'reliability',
        priority: 'high',
        title: 'Low Test Pass Rate',
        description: `Overall test pass rate is ${(passRate * 100).toFixed(1)}%`,
        suggestion: 'Review test suite health, fix failing tests, improve test quality',
      });
    }

    return recommendations;
  }
}

/**
 * Add performance metrics to the report
 */
function appendPerformanceMetrics(lines: string[], result: TestAnalyticsResult): void {
  lines.push('## Performance Metrics');
  lines.push(`- **Average Duration**: ${result.performance.averageDuration.toFixed(0)}ms`);
  lines.push(`- **Median Duration**: ${result.performance.medianDuration?.toFixed(0) ?? 'N/A'}ms`);
  lines.push(`- **95th Percentile**: ${result.performance.p95Duration.toFixed(0)}ms`);
  lines.push('');

  if (result.performance.slowestTests.length > 0) {
    lines.push('### Slowest Tests');
    result.performance.slowestTests.slice(0, 5).forEach((test, index) => {
      lines.push(`${index + 1}. ${test.name}: ${test.duration}ms`);
    });
    lines.push('');
  }
}

/**
 * Add reliability metrics to the report
 */
function appendReliabilityMetrics(lines: string[], result: TestAnalyticsResult): void {
  lines.push('## Reliability Metrics');
  lines.push(`- **Failure Rate**: ${(result.reliability.failureRate * 100).toFixed(1)}%`);
  lines.push(`- **Flaky Tests**: ${result.reliability.flakyTests.length}`);
  lines.push('');

  if (result.reliability.flakyTests.length > 0) {
    lines.push('### Flaky Tests');
    result.reliability.flakyTests.slice(0, 5).forEach((test, index) => {
      lines.push(
        `${index + 1}. ${test.name}: Flakiness ${(test.flakinessScore * 100).toFixed(1)}%`
      );
    });
    lines.push('');
  }

  if (result.reliability.mostFailingTests.length > 0) {
    lines.push('### Most Failing Tests');
    result.reliability.mostFailingTests.slice(0, 5).forEach((test, index) => {
      lines.push(`${index + 1}. ${test.name}: ${test.failureCount} failures`);
    });
    lines.push('');
  }
}

/**
 * Add recommendations to the report
 */
function appendRecommendations(lines: string[], result: TestAnalyticsResult): void {
  if (result.recommendations.length === 0) {
    return;
  }

  lines.push('## Recommendations');
  lines.push('');

  const highPriority = result.recommendations.filter((r) => r.priority === 'high');
  const mediumPriority = result.recommendations.filter((r) => r.priority === 'medium');
  const lowPriority = result.recommendations.filter((r) => r.priority === 'low');

  if (highPriority.length > 0) {
    lines.push('### 🔴 High Priority');
    highPriority.forEach((rec) => {
      lines.push(`- **${rec.title}**: ${rec.description}`);
      lines.push(`  *Suggestion*: ${rec.suggestion}`);
    });
    lines.push('');
  }

  if (mediumPriority.length > 0) {
    lines.push('### 🟡 Medium Priority');
    mediumPriority.forEach((rec) => {
      lines.push(`- **${rec.title}**: ${rec.description}`);
      lines.push(`  *Suggestion*: ${rec.suggestion}`);
    });
    lines.push('');
  }

  if (lowPriority.length > 0) {
    lines.push('### 🟢 Low Priority');
    lowPriority.forEach((rec) => {
      lines.push(`- **${rec.title}**: ${rec.description}`);
      lines.push(`  *Suggestion*: ${rec.suggestion}`);
    });
    lines.push('');
  }
}

/**
 * Generate analytics report
 */
export function generateAnalyticsReport(result: TestAnalyticsResult): string {
  const lines: string[] = [];

  lines.push('# Test Analytics Report');
  lines.push('');
  lines.push(`## Health Score: ${result.healthScore.toFixed(1)}/100`);
  lines.push('');

  lines.push('## Summary');
  lines.push(`- **Total Tests**: ${result.totalTests}`);
  lines.push(`- **Passed**: ${result.counts.passed}`);
  lines.push(`- **Failed**: ${result.counts.failed}`);
  lines.push(`- **Pass Rate**: ${(result.reliability.passRate * 100).toFixed(1)}%`);
  lines.push(`- **Analysis Date**: ${result.timestamp}`);
  lines.push('');

  appendPerformanceMetrics(lines, result);
  appendReliabilityMetrics(lines, result);
  appendRecommendations(lines, result);

  return lines.join('\n');
}

/**
 * Convenience function for tracking test metrics
 */
export function trackTestMetrics(result: unknown): TestMetrics {
  const typedResult = result as {
    suite: string;
    file: string;
    name: string;
    duration: number;
    passed: boolean;
  };
  return {
    suite: typedResult.suite,
    file: typedResult.file,
    name: typedResult.name,
    duration: typedResult.duration,
    passed: typedResult.passed,
    timestamp: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      os: process.platform,
      ci: !!process.env['CI'],
    },
  };
}

/**
 * Convenience function for analyzing flakiness
 */
export function analyzeFlakiness(testHistory: TestMetrics[]): FlakinessAnalysis[] {
  const analytics = new TestAnalytics();
  analytics.recordMultipleMetrics(testHistory);
  return analytics.generateInsights().flakinessAnalysis;
}

/**
 * Convenience function for predicting failures
 */
export function predictFailures(testHistory: TestMetrics[]): PredictiveFailure[] {
  const analytics = new TestAnalytics();
  analytics.recordMultipleMetrics(testHistory);
  return analytics.generateInsights().predictiveFailures;
}

/**
 * Utility functions
 */
function calculatePercentile(sortedArray: number[], percentile: number): number {
  if (sortedArray.length === 0) {
    return 0;
  }

  const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
  return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))] ?? 0;
}

function calculateHealthScore(passRate: number, p95Duration: number, flakyCount: number): number {
  // Health score based on pass rate, performance, and reliability
  const passRateScore = passRate * 100;
  const performanceScore = Math.max(0, 100 - p95Duration / 100); // Penalty for slow tests
  const reliabilityScore = Math.max(0, 100 - flakyCount * 5); // Penalty for flaky tests

  return (passRateScore + performanceScore + reliabilityScore) / 3;
}
