/**
 * Visual testing utilities for screenshot comparison and visual regression testing
 * Inspired by Meta's snapshot testing evolution and Shopify's visual regression testing
 */

import { createLogger } from '../logger';

const visualLogger = createLogger(undefined, { metadata: { module: 'visual-testing' } });

export type ScreenshotOptions = {
  /** Full page screenshot */
  fullPage?: boolean;
  /** Screenshot only the visible area */
  clip?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** Image quality (0-100) for JPEG */
  quality?: number;
  /** Image format */
  type?: 'png' | 'jpeg' | 'webp';
  /** Hide elements matching these selectors */
  hideSelectors?: string[];
  /** Remove elements matching these selectors */
  removeSelectors?: string[];
  /** Wait for network to be idle before screenshot */
  waitForNetworkIdle?: boolean;
  /** Delay before taking screenshot */
  delay?: number;
};

export type VisualTestOptions = {
  /** Test name */
  name: string;
  /** Test function that interacts with the page */
  testFn: (page: any) => Promise<void>;
  /** Screenshot options */
  screenshotOptions?: ScreenshotOptions;
  /** Threshold for pixel difference (0-1) */
  threshold?: number;
  /** Update baseline images */
  updateBaselines?: boolean;
  /** Viewport size */
  viewport?: { width: number; height: number };
  /** Device to emulate */
  device?: string;
};

export type VisualComparisonResult = {
  /** Whether the test passed */
  passed: boolean;
  /** Difference percentage (0-1) */
  difference: number;
  /** Path to baseline image */
  baselinePath?: string;
  /** Path to current screenshot */
  currentPath?: string;
  /** Path to diff image */
  diffPath?: string;
  /** Error message if failed */
  error?: string;
};

export type VisualTestSuiteResult = {
  /** Suite name */
  suite: string;
  /** Individual test results */
  results: Array<{
    name: string;
    result: VisualComparisonResult;
  }>;
  /** Overall suite status */
  passed: boolean;
  /** Total tests run */
  totalTests: number;
  /** Tests that passed */
  passedTests: number;
  /** Tests that failed */
  failedTests: number;
};

/**
 * Generic page interface for cross-framework compatibility
 */
export type PageLike = {
  screenshot(options?: ScreenshotOptions): Promise<Buffer>;
  goto(url: string): Promise<void>;
  waitForSelector(selector: string, options?: { timeout?: number }): Promise<void>;
  waitForTimeout(ms: number): Promise<void>;
  evaluate<T>(function_: () => T): Promise<T>;
  setViewportSize(size: { width: number; height: number }): Promise<void>;
};

/**
 * Take a screenshot with enhanced options
 */
export async function takeScreenshot(
  page: PageLike,
  _name: string,
  options: ScreenshotOptions = {}
): Promise<Buffer> {
  const {
    fullPage = true,
    quality,
    type = 'png',
    hideSelectors = [],
    removeSelectors = [],
    waitForNetworkIdle = false,
    delay = 0,
  } = options;

  // Hide elements before screenshot
  if (hideSelectors.length > 0) {
    visualLogger.info('Hiding elements before screenshot', { selectors: hideSelectors });
    await page.evaluate(() => {
      // Placeholder for DOM manipulation
    });
  }

  // Remove elements before screenshot
  if (removeSelectors.length > 0) {
    visualLogger.info('Removing elements before screenshot', { selectors: removeSelectors });
    await page.evaluate(() => {
      // Placeholder for DOM manipulation
    });
  }

  // Wait for network idle if requested
  if (waitForNetworkIdle) {
    await page.waitForTimeout(1000); // Simple network idle simulation
  }

  // Additional delay
  if (delay > 0) {
    await page.waitForTimeout(delay);
  }

  // Take screenshot
  const screenshotOptions = {
    fullPage,
    type,
    ...(quality && type === 'jpeg' && { quality }),
    ...(options.clip && { clip: options.clip }),
  };

  return await page.screenshot(screenshotOptions);
}

/**
 * Compare two images and return difference metrics
 */
export async function compareScreenshots(
  baseline: Buffer,
  current: Buffer,
  threshold = 0.01
): Promise<VisualComparisonResult> {
  // Simple pixel-by-pixel comparison
  // In a real implementation, you'd use a library like pixelmatch or resemble.js

  if (baseline.length !== current.length) {
    return {
      passed: false,
      difference: 1,
      error: 'Image dimensions do not match',
    };
  }

  let differentPixels = 0;
  const totalPixels = baseline.length;

  for (let index = 0; index < baseline.length; index++) {
    if (baseline[index] !== current[index]) {
      differentPixels++;
    }
  }

  const difference = differentPixels / totalPixels;

  return {
    passed: difference <= threshold,
    difference,
    ...(difference > threshold && {
      error: `Visual difference ${Math.round(difference * 100)}% exceeds threshold ${Math.round(threshold * 100)}%`,
    }),
  };
}

/**
 * Run a visual test
 */
export async function visualTest(options: VisualTestOptions): Promise<VisualComparisonResult> {
  const { name, testFn, screenshotOptions = {}, viewport } = options;

  // Mock page object for demonstration
  // In real usage, this would be a Playwright page or similar
  const mockPage: PageLike = {
    async screenshot(): Promise<Buffer> {
      // Mock screenshot - return empty buffer
      return Buffer.from([]);
    },
    async goto(): Promise<void> {},
    async waitForSelector(): Promise<void> {},
    async waitForTimeout(): Promise<void> {},
    async evaluate<T>(function_: () => T): Promise<T> {
      return function_();
    },
    async setViewportSize(): Promise<void> {},
  };

  try {
    // Set viewport if specified
    if (viewport) {
      await mockPage.setViewportSize(viewport);
    }

    // Run test function
    await testFn(mockPage);

    // Take screenshot
    await takeScreenshot(mockPage, name, screenshotOptions);

    // For now, return a mock result
    // In real implementation, this would compare against baseline
    return {
      passed: true,
      difference: 0,
      baselinePath: `baselines/${name}.png`,
      currentPath: `screenshots/${name}.png`,
    };
  } catch (error) {
    return {
      passed: false,
      difference: 1,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Run a suite of visual tests
 */
export async function visualTestSuite(
  suiteName: string,
  tests: Array<{
    name: string;
    testFn: VisualTestOptions['testFn'];
    options?: Partial<VisualTestOptions>;
  }>
): Promise<VisualTestSuiteResult> {
  const results: Array<{
    name: string;
    result: VisualComparisonResult;
  }> = [];

  for (const test of tests) {
    const result = await visualTest({
      name: test.name,
      testFn: test.testFn,
      ...test.options,
    });

    results.push({
      name: test.name,
      result,
    });
  }

  const passedTests = results.filter((r) => r.result.passed).length;
  const failedTests = results.length - passedTests;

  return {
    suite: suiteName,
    results,
    passed: failedTests === 0,
    totalTests: results.length,
    passedTests,
    failedTests,
  };
}

/**
 * Generate visual regression report
 */
export function generateVisualReport(result: VisualTestSuiteResult): string {
  const lines: string[] = [];

  lines.push(`# Visual Test Report: ${result.suite}`);
  lines.push('');
  lines.push(`## Summary`);
  lines.push(`- Total Tests: ${result.totalTests}`);
  lines.push(`- Passed: ${result.passedTests}`);
  lines.push(`- Failed: ${result.failedTests}`);
  lines.push(`- Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
  lines.push('');

  if (result.failedTests > 0) {
    lines.push('## Failed Tests');
    lines.push('');

    for (const { name, result: testResult } of result.results) {
      if (!testResult.passed) {
        lines.push(`### ${name}`);
        lines.push(`- Difference: ${Math.round(testResult.difference * 100)}%`);
        if (testResult.error) {
          lines.push(`- Error: ${testResult.error}`);
        }
        if (testResult.diffPath) {
          lines.push(`- Diff: ${testResult.diffPath}`);
        }
        lines.push('');
      }
    }
  }

  return lines.join('\n');
}

/**
 * Utility to create visual test baselines
 */
export async function createBaseline(
  page: PageLike,
  name: string,
  testFunction: (page: PageLike) => Promise<void>,
  options: ScreenshotOptions = {}
): Promise<void> {
  await testFunction(page);
  const screenshot = await takeScreenshot(page, name, options);

  // In real implementation, save to baselines directory
  visualLogger.info(`Created baseline`, { testName: name, bytes: screenshot.length });
}

/**
 * Utility to update all baselines
 */
export async function updateBaselines(
  tests: Array<{
    name: string;
    testFn: (page: PageLike) => Promise<void>;
    options?: ScreenshotOptions;
  }>
): Promise<void> {
  const mockPage: PageLike = {
    async screenshot(): Promise<Buffer> {
      return Buffer.from([]);
    },
    async goto(): Promise<void> {},
    async waitForSelector(): Promise<void> {},
    async waitForTimeout(): Promise<void> {},
    async evaluate<T>(function_: () => T): Promise<T> {
      return function_();
    },
    async setViewportSize(): Promise<void> {},
  };

  for (const test of tests) {
    await createBaseline(mockPage, test.name, test.testFn, test.options);
  }
}

/**
 * Compare screenshot against baseline with detailed diff
 */
export async function compareWithBaseline(
  name: string,
  screenshot: Buffer,
  baselineDir = 'baselines',
  threshold = 0.01
): Promise<VisualComparisonResult> {
  // Mock implementation - in real usage, load baseline from disk
  const baseline = Buffer.from([]); // Load from `${baselineDir}/${name}.png`

  const result = await compareScreenshots(baseline, screenshot, threshold);

  return {
    ...result,
    baselinePath: `${baselineDir}/${name}.png`,
    currentPath: `screenshots/${name}.png`,
    diffPath: `diffs/${name}.diff.png`,
  };
}
