# @kitiumai/test-core

**Enterprise-Grade Comprehensive Testing Utilities**

A feature-rich, modular testing library that provides everything needed for modern, enterprise-scale testing. From data generation and mock management to AI-powered test optimization and advanced browser testing, `@kitiumai/test-core` streamlines test development and execution.

## What is This Package?

`@kitiumai/test-core` is a comprehensive testing utility library that consolidates best practices from industry-leading testing frameworks. It provides:

- **10 specialized testing modules** covering performance, accessibility, contracts, chaos engineering, visual regression, browser automation, security, orchestration, analytics, and AI-powered testing
- **Builder and Factory patterns** for constructing complex test objects with fluent APIs
- **Mock management** with HTTP mocking, fixtures, and comprehensive spying capabilities
- **Advanced async utilities** including retry logic, deferred promises, and timing utilities
- **Configuration management** with schema validation and environment awareness
- **Structured logging** with mock loggers for test isolation
- **Data generation** with customizable generators for all common types

## Why We Need This Package

### Problems We Solve

1. **Fragmented Ecosystem** - Different testing needs require pulling in multiple libraries with conflicting patterns
2. **Boilerplate Reduction** - Common testing patterns (mocks, fixtures, builders) require repetitive setup
3. **Enterprise Scale** - Organizations need advanced features like contract testing, chaos engineering, and security testing in one place
4. **Test Quality** - Flakiness detection, AI-powered optimization, and visual regression detection are critical at scale
5. **Browser Testing** - Cross-browser, mobile responsiveness, and load testing need integrated solutions
6. **Developer Experience** - Unified API surface makes testing faster and more maintainable

## Competitor Comparison

| Feature | Jest | Vitest | Mocha | **@kitiumai/test-core** |
|---------|------|--------|-------|------------------------|
| Test Runner | ✅ | ✅ | ✅ | 🔄 Agnostic |
| Mocking | ✅ | ✅ | With Sinon | ✅ Built-in |
| Data Factories | ❌ | ❌ | ❌ | ✅ Advanced |
| Contract Testing | ❌ | ❌ | ❌ | ✅ |
| Chaos Engineering | ❌ | ❌ | ❌ | ✅ |
| Visual Regression | ❌ | ❌ | ❌ | ✅ |
| Accessibility Testing | ❌ | ❌ | ❌ | ✅ |
| Browser Automation | ❌ | ❌ | ❌ | ✅ |
| Security Testing | ❌ | ❌ | ❌ | ✅ |
| Test Orchestration | ❌ | ❌ | ❌ | ✅ |
| AI-Powered Testing | ❌ | ❌ | ❌ | ✅ |
| Analytics & Reporting | ❌ | ❌ | ❌ | ✅ |
| Schema Validation | ❌ | ❌ | ❌ | ✅ |

## Unique Selling Points (USP)

1. **All-in-One Solution** - No need for 10 different libraries; everything is integrated and battle-tested
2. **Framework Agnostic** - Works with Jest, Vitest, Mocha, or any testing framework
3. **Enterprise Features** - Contract testing, chaos engineering, and security testing built-in
4. **AI Integration** - Generate tests, optimize test suites, and predict failures with AI
5. **Advanced Analytics** - Track flakiness, performance regressions, and test coverage in real-time
6. **Modular Exports** - Tree-shake only what you need; zero unused code in production
7. **Type-Safe** - Full TypeScript support with comprehensive type definitions
8. **Mock Loggers** - Isolated testing without spawning timers or background tasks

## Installation

```bash
npm install @kitiumai/test-core

# or with pnpm
pnpm add @kitiumai/test-core

# or with yarn
yarn add @kitiumai/test-core
```

### Peer Dependencies

- Node.js 18.0.0 or higher
- TypeScript 5.6.0+ (optional, for type checking)

## Quick Start

```typescript
import {
  createBuilder,
  DataGenerators,
  createFixture,
  createHttpMockManager,
  createLogger,
  retry,
  waitFor,
  benchmark,
  auditAccessibility,
  visualTest,
  runSecurityTests,
  generateTestsWithAI,
} from '@kitiumai/test-core';

// Build complex test objects
const userBuilder = createBuilder({ id: '1', name: 'John' });
const user = userBuilder.with({ name: 'Jane' }).build();

// Generate test data
const email = DataGenerators.email();
const users = DataGenerators.batch('user', 10);

// Create fixtures
const dbFixture = createFixture({
  setup: async () => { /* ... */ },
  teardown: async () => { /* ... */ },
});

// Mock HTTP requests
const mockManager = createHttpMockManager();
mockManager.mock('GET', '/users', { status: 200, body: { users: [] } });

// Create loggers
const logger = createLogger();
logger.info('Test started');

// Async utilities
await retry(() => fetchData(), { maxAttempts: 3 });
await waitFor(() => element.isVisible());

// Performance testing
benchmark(() => expensiveOp(), { iterations: 100 });

// Accessibility
const audit = auditAccessibility(document);
console.log(audit.passed);

// Visual testing
await visualTest('homepage', element);

// Security
const vulns = await runSecurityTests(html);

// AI testing
const tests = generateTestsWithAI(sourceCode);
```

## Public API Surface

The package exports over 100+ functions and classes organized into logical modules:

### Builder Pattern
- `Builder` - Fluent builder for object construction
- `Sequence` - Sequence generator for unique values
- `createBuilder(initial)` - Create builder instance
- `createBuilderFactory(template)` - Create builder factories

### Data Generation & Factories
- `DataGenerators` - Comprehensive data generation utilities
- `Factory` - Base factory class
- `Factories` - Pre-built factory functions
- `createFactory(definition)` - Create object factories
- `createFactoryWithBuilder(builder)` - Combine factory and builder

### Fixtures
- `FixtureManager` - Global fixture management
- `createFixture(config)` - Create test fixtures
- `getGlobalFixtureManager()` - Get global fixture manager
- `resetGlobalFixtureManager()` - Reset fixture manager

### Mocking & Spying
- `createHttpMockManager()` - Create HTTP mock manager
- `getGlobalHttpMockManager()` - Get global HTTP mock manager
- `resetGlobalHttpMockManager()` - Reset HTTP mock manager
- `HttpMockManager` - HTTP request mocking
- `HttpResponses` - HTTP response utilities
- `createMockFunction(impl?)` - Create mock function
- `createMockObject(implementations)` - Create mock object
- `spyOn(object, method)` - Spy on object methods
- `restoreSpy(spy)` - Restore spied method

### Configuration
- `createConfigManager(defaults)` - Create config manager
- `getConfigManager()` - Get global config manager
- `resetConfig()` - Reset configuration

### Logging
- `createLogger(level?, context?)` - Create test logger
- `getTestLogger()` - Get global test logger
- `expectLogs(fn, matcher)` - Assert log output
- `LogLevel` - Logging levels enum

### Async Utilities
- `createDeferred()` - Create deferred promise
- `waitFor(condition, options)` - Wait for condition
- `waitForValue(getter, predicate, options)` - Wait for value change
- `retry(fn, options)` - Retry with backoff
- `sleep(ms)` - Sleep for duration
- `timeout(promise, ms)` - Timeout a promise
- `withTimeout(fn, ms, message)` - Execute with timeout

### Timing & Performance
- `measureTime(fn)` - Measure execution time
- `benchmark(fn, options)` - Benchmark function
- `assertExecutionTime(fn, options)` - Assert execution time
- `throttle(fn, ms)` - Throttle function calls
- `debounce(fn, ms)` - Debounce function calls
- `delayedFunction(fn, ms)` - Execute function with delay
- `parallelLimit(tasks, limit)` - Run tasks with concurrency limit

### Contract Testing
- `createContract(definition)` - Create API contract
- `validateContract(contract, response)` - Validate contract

### Accessibility Testing
- `auditAccessibility(page, options)` - Audit accessibility
- `detectCompatibilityIssues(html)` - Detect compatibility issues

### Visual Testing
- `visualTest(name, element)` - Perform visual test
- `takeScreenshot(element)` - Take screenshot
- `compareScreenshots(name, screenshot)` - Compare screenshots
- `createBaseline(name, element)` - Create visual baseline

### Security Testing
- `runSecurityTests(content, options)` - Run security tests
- `createSecurityRule(definition)` - Create security rule
- `generateSecurityReport(results)` - Generate security report
- `SECURITY_RULES` - Pre-defined security rules

### Chaos Engineering
- `injectNetworkChaos(fn, options)` - Inject network failures
- `injectServiceFailure(fn, options)` - Inject service failures
- `simulateLatency(fn, ms)` - Simulate latency
- `simulateError(fn, error)` - Simulate error
- `simulateTimeout(fn, ms)` - Simulate timeout
- `ChaosOrchestrator` - Chaos engineering orchestration

### Browser Testing
- `testMobileResponsiveness(page, devices, testFn)` - Test mobile
- `testCrossBrowser(fn, options)` - Test cross-browser
- `mobileEmulation(page, device, testFn)` - Emulate mobile
- `loadTest(url, options)` - Perform load test
- `stressTest(fn, options)` - Perform stress test
- `DEVICE_PRESETS` - Mobile device configurations

### Test Orchestration & Analytics
- `orchestrateTests(suites)` - Orchestrate test execution
- `shardTests(tests, workerCount)` - Shard tests
- `quarantineTests(tests, options)` - Quarantine flaky tests
- `TestOrchestrator` - Test orchestration
- `TestAnalytics` - Test metrics collection
- `trackTestMetrics(metrics)` - Track test metrics
- `analyzeFlakiness(metrics, options)` - Analyze test flakiness
- `generateAnalyticsReport(analytics)` - Generate report

### AI-Powered Testing
- `generateTestsWithAI(code, options)` - Generate tests with AI
- `optimizeTestsWithAI(tests, options)` - Optimize tests
- `getAITestSuggestions(code, existing?, options)` - Get suggestions
- `predictTestFailures(code)` - Predict failures
- `generateScenariosFromRequirements(requirements)` - Generate from requirements

### Utilities
- `deepClone(obj)` - Deep clone object
- `deepMerge(obj1, obj2)` - Deep merge objects
- `sanitizeForLogging(obj)` - Sanitize sensitive data
- `enhanceError(error, context)` - Enhance error object
- `EnhancedTestError` - Extended error class
- `TestErrorMessages` - Error message constants
- `BuilderGenerators` - Utility for generating builders

## Usage Examples

### Example 1: Building Complex Test Objects
```typescript
import { createBuilder, DataGenerators } from '@kitiumai/test-core';

interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
}

const userBuilder = createBuilder<User>({
  id: DataGenerators.uuid(),
  name: 'Default User',
  email: 'user@example.com',
  roles: ['user'],
});

const adminUser = userBuilder
  .with({ name: 'Admin', roles: ['admin', 'user'] })
  .build();
```

### Example 2: HTTP Mocking in Tests
```typescript
import { createHttpMockManager } from '@kitiumai/test-core';

describe('User API Integration', () => {
  let mockManager;

  beforeEach(() => {
    mockManager = createHttpMockManager();
  });

  test('should fetch user successfully', async () => {
    mockManager.mock('GET', '/users/123', {
      status: 200,
      body: { id: '123', name: 'John' }
    });

    const response = await fetch('/users/123');
    const data = await response.json();
    
    expect(data.name).toBe('John');
    await mockManager.verify('GET', '/users/123');
  });
});
```

### Example 3: Performance Testing
```typescript
import { benchmark, assertExecutionTime } from '@kitiumai/test-core';

test('search should complete within 500ms', async () => {
  await assertExecutionTime(
    async () => search('query'),
    { maxTime: 500 }
  );
});

test('should benchmark sorting algorithm', () => {
  const results = benchmark(
    () => expensiveSort([...largeArray]),
    { iterations: 100, warmupIterations: 10 }
  );
  
  console.log(`Average: ${results.averageTime}ms`);
});
```

### Example 4: Chaos Engineering
```typescript
import { injectNetworkChaos, simulateLatency } from '@kitiumai/test-core';

test('should handle network failures gracefully', async () => {
  const response = await injectNetworkChaos(
    async () => fetchUserData(),
    {
      latency: 500,
      jitterPercent: 20,
      dropRate: 0.1,
    }
  );
  
  expect(response).toBeDefined();
});
```

### Example 5: Contract Testing
```typescript
import { createContract, validateContract } from '@kitiumai/test-core';

const userContract = createContract({
  endpoint: 'GET /users/:id',
  request: {
    method: 'GET',
    path: '/users/123',
  },
  response: {
    status: 200,
    schema: {
      id: 'string',
      name: 'string',
      email: 'string',
    },
  },
});

test('API respects user contract', async () => {
  const response = await fetch('/users/123');
  const valid = await validateContract(userContract, response);
  
  expect(valid).toBe(true);
});
```

### Example 6: Accessibility Testing
```typescript
import { auditAccessibility } from '@kitiumai/test-core';

test('page should be WCAG2AA compliant', () => {
  const audit = auditAccessibility(document, {
    standards: ['WCAG2AA'],
    skipHidden: true,
  });

  expect(audit.passed).toBe(true);
  expect(audit.violations.errors).toHaveLength(0);
});
```

### Example 7: AI-Powered Test Generation
```typescript
import { generateTestsWithAI } from '@kitiumai/test-core';

test('should generate tests automatically', async () => {
  const sourceCode = `
    export function calculateTotal(items: Item[]): number {
      return items.reduce((sum, item) => sum + item.price, 0);
    }
  `;

  const generatedTests = generateTestsWithAI(sourceCode, {
    framework: 'jest',
    coverage: { statements: 90, branches: 85 },
  });

  expect(generatedTests.length).toBeGreaterThan(0);
});
```

## Configuration

The package can be configured via environment variables:

```bash
# Test timeout (ms)
TEST_TIMEOUT=30000

# Logging level
LOG_LEVEL=info

# Enable debug output
DEBUG=@kitiumai/test-core:*

# API base URL for testing
API_URL=http://localhost:3000

# Number of parallel test workers
PARALLEL_WORKERS=4
```

## Best Practices

1. **Use Builders for Complex Objects** - Reduces boilerplate and improves readability
2. **Isolate with Fixtures** - Use fixtures for setup/teardown to avoid side effects
3. **Mock External Dependencies** - Use HTTP mocking for API calls
4. **Test Performance** - Use benchmark and assertExecutionTime regularly
5. **Leverage AI** - Use AI-powered testing for better coverage
6. **Monitor Analytics** - Track flakiness and performance regressions
7. **Clean Up Resources** - Always call teardown for fixtures and mocks
8. **Shard Tests** - Use test sharding in CI for faster execution

## Performance Tips

- **Tree-shake unused exports** - Only import what you need
- **Use mock loggers** - Avoid creating real loggers in test setup
- **Batch operations** - Use `parallelLimit` to control concurrency
- **Cache fixtures** - Reuse fixtures across test suites
- **Enable test sharding** - Distribute tests across workers

## Browser Support

`@kitiumai/test-core` works with:
- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT

## Support

For issues, questions, or suggestions, please open an issue on GitHub or contact the KitiumAI team.

---

**Made with ❤️ by KitiumAI**
