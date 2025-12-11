/**
 * @kitiumai/test-core TypeScript declarations for module augmentation and subpath support
 */

declare module '@kitiumai/test-core' {
  export function createDeferred(): any;
  export function parallelLimit(fns: any[], limit: number): any;
  export function retry(fn: any, options?: any): any;
  export function sleep(ms: number): any;
  export function waitFor(condition: any, options?: any): any;
  export function waitForValue(getValue: any, expectedValue: any, options?: any): any;

  export const Builder: any;
  export const Factory: any;
  export const Sequence: any;
  export function createBuilder(...args: any[]): any;
  export function createFactory(...args: any[]): any;
  export function createFactoryWithBuilder(...args: any[]): any;

  export function createConfigManager(...args: any[]): any;
  export function getConfigManager(): any;
  export function resetConfig(): any;

  export const DataGenerators: any;
  export const Factories: any;

  export function createTestError(...args: any[]): any;
  export const EnhancedTestError: any;
  export function enhanceError(...args: any[]): any;

  export function createFixture(...args: any[]): any;
  export const FixtureManager: any;
  export function getGlobalFixtureManager(): any;
  export function resetGlobalFixtureManager(): any;

  export function createHttpMockManager(...args: any[]): any;
  export function getGlobalHttpMockManager(): any;
  export const HttpMockManager: any;
  export const HttpResponses: any;
  export function resetGlobalHttpMockManager(): any;

  export function createLogger(...args: any[]): any;
  export function expectLogs(...args: any[]): any;
  export function getTestLogger(): any;

  export function createMockFn(...args: any[]): any;
  export function createMockObject(...args: any[]): any;
  export function restoreSpy(...args: any[]): any;
  export function spyOn(...args: any[]): any;

  export function assertExecutionTime(...args: any[]): any;
  export function debounce(...args: any[]): any;
  export function delayedFn(...args: any[]): any;
  export function measureTime(...args: any[]): any;
  export function throttle(...args: any[]): any;
  export function timeout(...args: any[]): any;
  export function withTimeout(...args: any[]): any;

  export function deepClone(...args: any[]): any;
  export function deepMerge(...args: any[]): any;
  export function sanitizeForLogging(...args: any[]): any;

  export type Deferred = any;
  export type Generator = any;
  export type PartialFactory = any;
  export type ErrorContext = any;
  export type Fixture = any;
  export type FixtureSetup = any;
  export type FixtureTeardown = any;
  export type HttpMockHandler = any;
  export type HttpMockRequest = any;
  export type HttpMockResponse = any;
  export type MockFunction = any;
  export type TestConfig = any;
  export type ResolvedTestConfig = any;
  export type LogExpectation = any;
  export type TestLogger = any;
  export type TestLogEntry = any;
  export type GetLogsOptions = any;
}

declare module '@kitiumai/test-core/async' {
  export function createDeferred(): any;
  export function parallelLimit(fns: any[], limit: number): any;
  export function retry(fn: any, options?: any): any;
  export function sleep(ms: number): any;
  export function waitFor(condition: any, options?: any): any;
  export function waitForValue(getValue: any, expectedValue: any, options?: any): any;

  export type Deferred = any;
}

declare module '@kitiumai/test-core/builders' {
  export const Builder: any;
  export const Factory: any;
  export const Sequence: any;
  export const Generators: any;
  export function createBuilder(...args: any[]): any;
  export function createFactory(...args: any[]): any;
}

declare module '@kitiumai/test-core/config' {
  export function createConfigManager(...args: any[]): any;
  export function getConfigManager(): any;
  export function resetConfig(): any;

  export type TestConfig = any;
  export type ResolvedTestConfig = any;
}

declare module '@kitiumai/test-core/data' {
  export const DataGenerators: any;
  export const Factories: any;
  export function createFactory(...args: any[]): any;
  export function createFactoryWithBuilder(...args: any[]): any;

  export type Generator = any;
  export type PartialFactory = any;
}

declare module '@kitiumai/test-core/errors' {
  export function createTestError(...args: any[]): any;
  export const EnhancedTestError: any;
  export function enhanceError(...args: any[]): any;

  export type ErrorContext = any;
}

declare module '@kitiumai/test-core/fixtures' {
  export function createFixture(...args: any[]): any;
  export const FixtureManager: any;
  export function getGlobalFixtureManager(): any;
  export function resetGlobalFixtureManager(): any;

  export type Fixture = any;
  export type FixtureSetup = any;
  export type FixtureTeardown = any;
}

declare module '@kitiumai/test-core/http' {
  export function createHttpMockManager(...args: any[]): any;
  export function getGlobalHttpMockManager(): any;
  export const HttpMockManager: any;
  export const HttpResponses: any;
  export function resetGlobalHttpMockManager(): any;

  export type HttpMockHandler = any;
  export type HttpMockRequest = any;
  export type HttpMockResponse = any;
}

declare module '@kitiumai/test-core/logger' {
  export function createLogger(...args: any[]): any;
  export function expectLogs(...args: any[]): any;
  export function getTestLogger(): any;

  export type TestLogger = any;
  export type TestLogEntry = any;
  export type GetLogsOptions = any;
  export type LogExpectation = any;
}

declare module '@kitiumai/test-core/mocks' {
  export function createMockFn(...args: any[]): any;
  export function createMockObject(...args: any[]): any;
  export function restoreSpy(...args: any[]): any;
  export function spyOn(...args: any[]): any;

  export type MockFunction = any;
}

declare module '@kitiumai/test-core/timers' {
  export function assertExecutionTime(...args: any[]): any;
  export function debounce(...args: any[]): any;
  export function delayedFn(...args: any[]): any;
  export function measureTime(...args: any[]): any;
  export function throttle(...args: any[]): any;
  export function timeout(...args: any[]): any;
  export function withTimeout(...args: any[]): any;
}

declare module '@kitiumai/test-core/utils' {
  export function deepClone(...args: any[]): any;
  export function deepMerge(...args: any[]): any;
  export function sanitizeForLogging(...args: any[]): any;
}

declare module '@kitiumai/config/vitest.config.base.js' {
  export type VitestBaseConfig = Record<string, unknown>;
  const config: VitestBaseConfig;
  export default config;
}

declare module 'vitest/config' {
  export type UserConfigExport = Record<string, unknown>;
  export function defineConfig(config: UserConfigExport): UserConfigExport;
}
