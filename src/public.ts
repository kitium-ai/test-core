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
