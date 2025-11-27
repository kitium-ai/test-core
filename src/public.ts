/**
 * Stable public API surface for @kitiumai/test-core
 */

export {
  createLogger,
  getTestLogger,
  expectLogs,
  LogLevel,
  type LogExpectation,
  type TestLogger,
  type TestLogEntry,
  type GetLogsOptions,
} from './logger';

export {
  createConfigManager,
  getConfigManager,
  resetConfig,
  type TestConfig,
  type ResolvedTestConfig,
} from './config';

export {
  waitFor,
  waitForValue,
  retry,
  parallelLimit,
  createDeferred,
  type Deferred,
  sleep,
} from './async';

export { deepClone, deepMerge, sanitizeForLogging } from './utils';

export {
  DataGenerators,
  Factories,
  createFactory,
  createFactoryWithBuilder,
  type Generator,
  type PartialFactory,
} from './data';

export {
  createMockFn,
  createMockObject,
  spyOn,
  restoreSpy,
  type MockFunction,
} from './mocks';

export {
  FixtureManager,
  createFixture,
  getGlobalFixtureManager,
  resetGlobalFixtureManager,
  type Fixture,
  type FixtureSetup,
  type FixtureTeardown,
} from './fixtures';

export {
  HttpMockManager,
  createHttpMockManager,
  getGlobalHttpMockManager,
  resetGlobalHttpMockManager,
  HttpResponses,
  type HttpMockRequest,
  type HttpMockResponse,
  type HttpMockHandler,
} from './http';

export {
  Builder,
  Sequence,
  Factory,
  createBuilder,
  createFactory as createBuilderFactory,
  Generators as BuilderGenerators,
} from './builders';

export {
  EnhancedTestError,
  TestErrorMessages,
  createTestError,
  enhanceError,
  type ErrorContext,
} from './errors';

export {
  timeout,
  withTimeout,
  debounce,
  throttle,
  measureTime,
  assertExecutionTime,
  delayedFn,
} from './timers';
