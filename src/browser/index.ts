/**
 * Cross-browser and mobile testing utilities
 * Inspired by Microsoft's Playwright ecosystem
 */

import { createMockLogger } from '../logger';

export type BrowserConfig = {
  /** Browser name */
  name: 'chrome' | 'firefox' | 'safari' | 'edge' | 'webkit';
  /** Browser version (optional) */
  version?: string;
  /** Headless mode */
  headless?: boolean;
  /** Viewport size */
  viewport?: { width: number; height: number };
  /** Device emulation */
  device?: DevicePreset;
  /** Additional launch options */
  launchOptions?: Record<string, unknown>;
};

export type DevicePreset = {
  /** Device name */
  name: string;
  /** User agent string */
  userAgent: string;
  /** Viewport size */
  viewport: { width: number; height: number };
  /** Device scale factor */
  deviceScaleFactor: number;
  /** Touch capability */
  hasTouch: boolean;
  /** Mobile device flag */
  isMobile: boolean;
  /** Device orientation */
  defaultOrientation?: 'portrait' | 'landscape';
};

export type CrossBrowserTestOptions = {
  /** Browsers to test against */
  browsers: BrowserConfig[];
  /** Test timeout in milliseconds */
  timeout?: number;
  /** Screenshot on failure */
  screenshotOnFailure?: boolean;
  /** Video recording */
  recordVideo?: boolean;
  /** Parallel execution */
  parallel?: boolean;
  /** Retry configuration */
  retry?: {
    attempts: number;
    onFailureOnly?: boolean;
  };
};

export type CrossBrowserTestResult = {
  /** Test name */
  testName: string;
  /** Results for each browser */
  browserResults: Array<{
    browser: string;
    passed: boolean;
    duration: number;
    error?: string;
    screenshot?: Buffer;
    video?: Buffer;
  }>;
  /** Overall test status */
  passed: boolean;
  /** Total duration across all browsers */
  totalDuration: number;
  /** Timestamp */
  timestamp: string;
};

export type MobileTestOptions = {
  /** Devices to test */
  devices: DevicePreset[];
  /** Orientation */
  orientation?: 'portrait' | 'landscape';
  /** Touch actions to test */
  touchActions?: boolean;
  /** Gesture testing */
  gestures?: boolean;
};

export type BrowserCompatibilityIssue = {
  /** Browser where issue occurred */
  browser: string;
  /** Issue type */
  type: 'css' | 'javascript' | 'layout' | 'functionality' | 'performance';
  /** Severity */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Description */
  description: string;
  /** Affected elements/selectors */
  affectedElements?: string[];
  /** Screenshot evidence */
  screenshot?: Buffer;
  /** Suggested fix */
  suggestion?: string;
};

export type BrowserMatrix = {
  /** Browsers to test */
  browsers: BrowserConfig[];
  /** Test scenarios */
  scenarios: Array<{
    name: string;
    testFn: (browser: BrowserInstance) => Promise<void>;
  }>;
  /** Compatibility requirements */
  requirements?: {
    minVersions?: Record<string, string>;
    supportedFeatures?: string[];
    excludedBrowsers?: string[];
  };
};

type BrowserTestOutcome = CrossBrowserTestResult['browserResults'][number];

const browserLogger = createMockLogger();

/**
 * Generic browser instance interface
 */
export type BrowserInstance = {
  /** Browser name */
  name: string;
  /** Navigate to URL */
  goto(url: string): Promise<void>;
  /** Take screenshot */
  screenshot(options?: {
    fullPage?: boolean;
    clip?: { x: number; y: number; width: number; height: number };
  }): Promise<Buffer>;
  /** Execute JavaScript */
  evaluate<T>(function_: () => T): Promise<T>;
  /** Wait for element */
  waitForSelector(selector: string, options?: { timeout?: number }): Promise<void>;
  /** Click element */
  click(selector: string): Promise<void>;
  /** Type text */
  type(selector: string, text: string): Promise<void>;
  /** Get element text */
  textContent(selector: string): Promise<string | null>;
  /** Close browser */
  close(): Promise<void>;
};

/**
 * Predefined device presets
 */
export const DEVICE_PRESETS: Record<string, DevicePreset> = {
  'iPhone 12': {
    name: 'iPhone 12',
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    hasTouch: true,
    isMobile: true,
    defaultOrientation: 'portrait',
  },
  'iPhone SE': {
    name: 'iPhone SE',
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
    viewport: { width: 375, height: 667 },
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true,
    defaultOrientation: 'portrait',
  },
  'Pixel 5': {
    name: 'Pixel 5',
    userAgent:
      'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36',
    viewport: { width: 393, height: 851 },
    deviceScaleFactor: 2.75,
    hasTouch: true,
    isMobile: true,
    defaultOrientation: 'portrait',
  },
  iPad: {
    name: 'iPad',
    userAgent:
      'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
    viewport: { width: 768, height: 1024 },
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: false,
    defaultOrientation: 'portrait',
  },
  'Desktop Chrome': {
    name: 'Desktop Chrome',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    hasTouch: false,
    isMobile: false,
  },
};

/**
 * Execute a single browser test with timeout and error handling
 */
async function executeBrowserTest(
  browserConfig: BrowserConfig,
  testFunction: (browser: BrowserInstance) => Promise<void>,
  timeout: number,
  screenshotOnFailure: boolean
): Promise<BrowserTestOutcome> {
  const browserStartTime = Date.now();

  try {
    // Create browser instance (mock implementation)
    const browserInstance: BrowserInstance = createMockBrowserInstance(browserConfig);

    // Run test function
    await Promise.race([
      testFunction(browserInstance),
      new Promise((_resolve, reject) =>
        setTimeout(() => reject(new Error(`Test timeout after ${timeout}ms`)), timeout)
      ),
    ]);

    await browserInstance.close();

    return {
      browser: browserConfig.name,
      passed: true,
      duration: Date.now() - browserStartTime,
    };
  } catch (error) {
    const duration = Date.now() - browserStartTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    let screenshot: Buffer | undefined;
    if (screenshotOnFailure) {
      // In real implementation, take screenshot of failure
      screenshot = Buffer.from('mock-screenshot');
    }

    const failureResult: BrowserTestOutcome = {
      browser: browserConfig.name,
      passed: false,
      duration,
      error: errorMessage,
    };
    if (screenshot) {
      failureResult.screenshot = screenshot;
    }
    return failureResult;
  }
}

/**
 * Run tests across all browsers in parallel
 */
async function runBrowserTestsInParallel(
  browsers: BrowserConfig[],
  testFunction: (browser: BrowserInstance) => Promise<void>,
  timeout: number,
  screenshotOnFailure: boolean
): Promise<CrossBrowserTestResult['browserResults']> {
  const browserResults: CrossBrowserTestResult['browserResults'] = [];
  const promises = browsers.map((browser) =>
    executeBrowserTest(browser, testFunction, timeout, screenshotOnFailure)
  );
  const results = await Promise.allSettled(promises);

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      browserResults.push(result.value);
    } else {
      const errorResult = {
        browser: browsers[index]?.name ?? 'unknown',
        passed: false,
        duration: 0,
        error: result.reason instanceof Error ? result.reason.message : String(result.reason),
      };
      browserResults.push(errorResult);
    }
  });

  return browserResults;
}

/**
 * Run cross-browser tests
 */
export async function testCrossBrowser(
  testFunction: (browser: BrowserInstance) => Promise<void>,
  browsers: BrowserConfig[] = [
    { name: 'chrome', headless: true },
    { name: 'firefox', headless: true },
    { name: 'webkit', headless: true },
  ],
  options: Omit<CrossBrowserTestOptions, 'browsers'> = {}
): Promise<CrossBrowserTestResult> {
  const { timeout = 30000, screenshotOnFailure = true, parallel = false } = options;

  const startTime = Date.now();
  let browserResults: CrossBrowserTestResult['browserResults'];

  // Run tests
  if (parallel) {
    browserResults = await runBrowserTestsInParallel(
      browsers,
      testFunction,
      timeout,
      screenshotOnFailure
    );
  } else {
    browserResults = [];
    for (const browser of browsers) {
      const result = await executeBrowserTest(browser, testFunction, timeout, screenshotOnFailure);
      browserResults.push(result);
    }
  }

  const totalDuration = Date.now() - startTime;
  const passed = browserResults.every((r) => r.passed);

  return {
    testName: 'cross-browser-test',
    browserResults,
    passed,
    totalDuration,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Test mobile responsiveness
 */
export async function testMobileResponsiveness(
  page: BrowserInstance,
  devices: DevicePreset[] = [
    DEVICE_PRESETS['iPhone 12'],
    DEVICE_PRESETS['Pixel 5'],
    DEVICE_PRESETS['iPad'],
  ].filter((device): device is DevicePreset => device !== undefined),
  testFunction?: (page: BrowserInstance, device: DevicePreset) => Promise<void>
): Promise<Array<{ device: string; passed: boolean; issues: BrowserCompatibilityIssue[] }>> {
  const results: Array<{ device: string; passed: boolean; issues: BrowserCompatibilityIssue[] }> =
    [];

  for (const device of devices) {
    try {
      // Set device emulation
      browserLogger.info(`Emulating device: ${device.name}`, { device: device.name });
      await page.evaluate(() => {
        // Placeholder for actual emulation logic
      });

      // Run custom test function if provided
      if (testFunction) {
        await testFunction(page, device);
      } else {
        // Default responsiveness checks
        await performResponsivenessChecks(page, device);
      }

      results.push({
        device: device.name,
        passed: true,
        issues: [],
      });
    } catch (error) {
      results.push({
        device: device.name,
        passed: false,
        issues: [
          {
            browser: 'mobile-emulation',
            type: 'functionality',
            severity: 'high',
            description: error instanceof Error ? error.message : String(error),
            suggestion: 'Check mobile layout and touch interactions',
          },
        ],
      });
    }
  }

  return results;
}

/**
 * Emulate mobile device
 */
export async function mobileEmulation(
  page: BrowserInstance,
  options: {
    device: string | DevicePreset;
    orientation?: 'portrait' | 'landscape';
  }
): Promise<void> {
  const device =
    typeof options.device === 'string' ? DEVICE_PRESETS[options.device] : options.device;

  if (!device) {
    throw new Error(`Unknown device: ${options.device}`);
  }

  // Apply device emulation
  browserLogger.info(`Mobile emulation: ${device.name}`, { device: device.name });
  await page.evaluate(() => {
    // Placeholder for actual emulation logic
  });
}

/**
 * Check CSS feature compatibility
 */
async function checkCSSCompatibility(page: BrowserInstance): Promise<BrowserCompatibilityIssue[]> {
  return await page.evaluate(() => {
    const compatibilityIssues: BrowserCompatibilityIssue[] = [];

    // Check for unsupported CSS features
    const testElement = document.createElement('div');
    testElement.style.cssText = `
      display: grid;
      display: flex;
      backdrop-filter: blur(10px);
      mask-image: linear-gradient(black, transparent);
    `;
    document.body.appendChild(testElement);

    // Check grid support
    if (window.getComputedStyle(testElement).display !== 'grid') {
      compatibilityIssues.push({
        browser: navigator.userAgent,
        type: 'css',
        severity: 'medium',
        description: 'CSS Grid not supported',
        suggestion: 'Provide fallback layout using flexbox',
      });
    }

    // Check backdrop-filter support
    if (!('backdropFilter' in testElement.style)) {
      compatibilityIssues.push({
        browser: navigator.userAgent,
        type: 'css',
        severity: 'low',
        description: 'Backdrop-filter not supported',
        suggestion: 'Provide fallback background effect',
      });
    }

    document.body.removeChild(testElement);
    return compatibilityIssues;
  });
}

/**
 * Check JavaScript feature compatibility
 */
async function checkJavaScriptCompatibility(
  page: BrowserInstance
): Promise<BrowserCompatibilityIssue[]> {
  return await page.evaluate(() => {
    const compatibilityIssues: BrowserCompatibilityIssue[] = [];

    // Check for modern JS features
    if (!window.Promise) {
      compatibilityIssues.push({
        browser: navigator.userAgent,
        type: 'javascript',
        severity: 'critical',
        description: 'Promises not supported',
        suggestion: 'Include Promise polyfill',
      });
    }

    if (!window.fetch) {
      compatibilityIssues.push({
        browser: navigator.userAgent,
        type: 'javascript',
        severity: 'high',
        description: 'Fetch API not supported',
        suggestion: 'Include fetch polyfill or use XMLHttpRequest',
      });
    }

    if (!('IntersectionObserver' in window)) {
      compatibilityIssues.push({
        browser: navigator.userAgent,
        type: 'javascript',
        severity: 'medium',
        description: 'IntersectionObserver not supported',
        suggestion: 'Provide fallback for lazy loading',
      });
    }

    return compatibilityIssues;
  });
}

/**
 * Detect browser compatibility issues
 */
export async function detectCompatibilityIssues(
  page: BrowserInstance,
  browser: string
): Promise<BrowserCompatibilityIssue[]> {
  const issues: BrowserCompatibilityIssue[] = [];

  try {
    // Check CSS support
    const cssIssues = await checkCSSCompatibility(page);
    issues.push(...cssIssues);

    // Check JavaScript features
    const jsIssues = await checkJavaScriptCompatibility(page);
    issues.push(...jsIssues);
  } catch (error) {
    issues.push({
      browser,
      type: 'functionality',
      severity: 'high',
      description: `Failed to detect compatibility issues: ${error instanceof Error ? error.message : String(error)}`,
      suggestion: 'Manual compatibility testing required',
    });
  }

  return issues;
}

/**
 * Add browser results to the report
 */
function appendBrowserResults(lines: string[], results: CrossBrowserTestResult): void {
  lines.push('## Browser Results');
  lines.push('');
  results.browserResults.forEach((result) => {
    lines.push(`### ${result.browser}`);
    lines.push(`- **Status**: ${result.passed ? '✅ Passed' : '❌ Failed'}`);
    lines.push(`- **Duration**: ${result.duration}ms`);
    if (result.error) {
      lines.push(`- **Error**: ${result.error}`);
    }
    lines.push('');
  });
}

/**
 * Add issues of a specific severity to the report
 */
function appendIssuesBySeverity(
  lines: string[],
  issues: BrowserCompatibilityIssue[],
  title: string
): void {
  if (issues.length === 0) {
    return;
  }

  lines.push(`### ${title}`);
  issues.forEach((issue) => {
    lines.push(`- **${issue.browser}**: ${issue.description}`);
    if (issue.suggestion) {
      lines.push(`  - *Fix*: ${issue.suggestion}`);
    }
  });
  lines.push('');
}

/**
 * Add compatibility issues to the report
 */
function appendCompatibilityIssues(
  lines: string[],
  compatibilityIssues: BrowserCompatibilityIssue[]
): void {
  if (compatibilityIssues.length === 0) {
    return;
  }

  lines.push('## Compatibility Issues');
  lines.push('');

  const criticalIssues = compatibilityIssues.filter((index) => index.severity === 'critical');
  const highIssues = compatibilityIssues.filter((index) => index.severity === 'high');
  const mediumIssues = compatibilityIssues.filter((index) => index.severity === 'medium');
  const lowIssues = compatibilityIssues.filter((index) => index.severity === 'low');

  appendIssuesBySeverity(lines, criticalIssues, '🚨 Critical Issues');
  appendIssuesBySeverity(lines, highIssues, '🔴 High Priority');
  appendIssuesBySeverity(lines, mediumIssues, '🟡 Medium Priority');
  appendIssuesBySeverity(lines, lowIssues, '🟢 Low Priority');
}

/**
 * Generate browser compatibility report
 */
export function generateCompatibilityReport(
  results: CrossBrowserTestResult,
  compatibilityIssues: BrowserCompatibilityIssue[] = []
): string {
  const lines: string[] = [];

  lines.push('# Browser Compatibility Report');
  lines.push('');
  lines.push(`## Test: ${results.testName}`);
  lines.push(`- **Status**: ${results.passed ? '✅ PASSED' : '❌ FAILED'}`);
  lines.push(`- **Total Duration**: ${results.totalDuration}ms`);
  lines.push(`- **Timestamp**: ${results.timestamp}`);
  lines.push('');

  appendBrowserResults(lines, results);
  appendCompatibilityIssues(lines, compatibilityIssues);

  return lines.join('\n');
}

/**
 * Utility functions
 */
function createMockBrowserInstance(config: BrowserConfig): BrowserInstance {
  return {
    name: config.name,
    goto: (url: string): Promise<void> => {
      browserLogger.info(`Mock navigation`, { url });
      return Promise.resolve();
    },
    screenshot: (): Promise<Buffer> => {
      return Promise.resolve(Buffer.from('mock-screenshot'));
    },
    evaluate: <T>(function_: () => T): Promise<T> => {
      return Promise.resolve(function_());
    },
    waitForSelector: (selector: string): Promise<void> => {
      browserLogger.info(`Mock waiting for selector`, { selector });
      return Promise.resolve();
    },
    click: (selector: string): Promise<void> => {
      browserLogger.info(`Mock click`, { selector });
      return Promise.resolve();
    },
    type: (selector: string, text: string): Promise<void> => {
      browserLogger.info(`Mock type`, { selector, text });
      return Promise.resolve();
    },
    textContent: (selector: string): Promise<string | null> => {
      return Promise.resolve(`Mock text from ${selector}`);
    },
    close: (): Promise<void> => {
      browserLogger.info('Mock browser closed');
      return Promise.resolve();
    },
  };
}

async function performResponsivenessChecks(
  page: BrowserInstance,
  device: DevicePreset
): Promise<void> {
  // Mock responsiveness checks
  browserLogger.info(`Performing responsiveness checks`, { device: device.name });

  // Check viewport
  const viewport = await page.evaluate(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));

  if (viewport.width !== device.viewport.width || viewport.height !== device.viewport.height) {
    throw new Error(`Viewport mismatch for ${device.name}`);
  }

  // Check touch capability
  if (device.hasTouch) {
    const hasTouch = await page.evaluate(() => 'ontouchstart' in window);
    if (!hasTouch) {
      throw new Error(`Touch not supported on ${device.name}`);
    }
  }
}
