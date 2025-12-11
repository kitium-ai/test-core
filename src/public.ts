/**
 * Stable public API surface for @kitiumai/test-core
 */

export {
  createDeferred,
  type Deferred,
  parallelLimit,
  retry,
  sleep,
  waitFor,
  waitForValue,
} from './async';
export {
  Builder,
  Generators as BuilderGenerators,
  createBuilder,
  createFactory as createBuilderFactory,
  Factory,
  Sequence,
} from './builders';
export {
  createConfigManager,
  getConfigManager,
  resetConfig,
  type ResolvedTestConfig,
  type TestConfig,
} from './config';
export {
  createFactory,
  createFactoryWithBuilder,
  DataGenerators,
  Factories,
  type Generator,
  type PartialFactory,
} from './data';
export {
  createTestError,
  EnhancedTestError,
  enhanceError,
  type ErrorContext,
  TestErrorMessages,
} from './errors';
export {
  createFixture,
  type Fixture,
  FixtureManager,
  type FixtureSetup,
  type FixtureTeardown,
  getGlobalFixtureManager,
  resetGlobalFixtureManager,
} from './fixtures';
export {
  createHttpMockManager,
  getGlobalHttpMockManager,
  type HttpMockHandler,
  HttpMockManager,
  type HttpMockRequest,
  type HttpMockResponse,
  HttpResponses,
  resetGlobalHttpMockManager,
} from './http';
export {
  createLogger,
  expectLogs,
  type GetLogsOptions,
  getTestLogger,
  type LogExpectation,
  LogLevel,
  type TestLogEntry,
  type TestLogger,
} from './logger';
export {
  createMockFunction,
  createMockObject,
  type MockFunction,
  restoreSpy,
  spyOn,
} from './mocks';
export {
  assertExecutionTime,
  debounce,
  delayedFunction,
  measureTime,
  throttle,
  timeout,
  withTimeout,
} from './timers';
export { deepClone, deepMerge, sanitizeForLogging } from './utils';

// Performance testing utilities
export {
  benchmark,
  type BenchmarkResult,
  loadTest,
  type LoadTestOptions,
  type LoadTestResult,
  stressTest,
  type StressTestOptions,
  type StressTestResult,
} from './performance';

// Visual testing utilities
export {
  compareScreenshots,
  createBaseline,
  type ScreenshotOptions,
  takeScreenshot,
  visualTest,
  type VisualTestOptions,
} from './visual';

// Accessibility testing utilities
export {
  type AccessibilityAuditOptions,
  type AccessibilityAuditResult,
  auditAccessibility,
} from './accessibility';

// Contract testing utilities
export {
  type APIContract,
  type ContractTestSuiteResult,
  type ContractValidationError,
  createContract,
  validateContract,
} from './contracts';

// Chaos engineering utilities
export {
  type ChaosExperiment,
  ChaosOrchestrator,
  injectNetworkChaos,
  injectServiceFailure,
  simulateError,
  simulateLatency,
  simulateTimeout,
} from './chaos';

// Test orchestration utilities
export {
  orchestrateTests,
  quarantineTests,
  shardTests,
  TestOrchestrator,
  type TestShard,
  type TestSuite,
} from './orchestration';

// Analytics utilities
export {
  analyzeFlakiness,
  generateAnalyticsReport,
  predictFailures,
  TestAnalytics,
  type TestAnalyticsResult,
  type TestMetrics,
  trackTestMetrics,
} from './analytics';

// Browser testing utilities
export {
  type BrowserCompatibilityIssue,
  type BrowserConfig,
  type BrowserInstance,
  type BrowserMatrix,
  type CrossBrowserTestOptions,
  type CrossBrowserTestResult,
  detectCompatibilityIssues,
  DEVICE_PRESETS,
  type DevicePreset,
  generateCompatibilityReport,
  mobileEmulation,
  type MobileTestOptions,
  testCrossBrowser,
  testMobileResponsiveness,
} from './browser';

// Security testing utilities
export {
  createSecurityRule,
  generateSecurityReport,
  type HttpClient,
  type OWASPCategory,
  runSecurityTests,
  SECURITY_RULES,
  type SecurityCheck,
  type SecurityFinding,
  type SecurityRule,
  type SecurityTestContext,
  type SecurityTestOptions,
  type SecurityTestResult,
} from './security';

// AI-powered testing utilities
export {
  type AIGeneratedTest,
  type AITestAnalysis,
  type AITestOptimization,
  type AITestOptions,
  type AITestSuggestion,
  analyzeTestsWithAI,
  generateScenariosFromRequirements,
  generateTestsWithAI,
  getAITestSuggestions,
  optimizeTestsWithAI,
  predictTestFailures,
  type TestType,
} from './ai';
