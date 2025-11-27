# @kitiumai/test-core

Core test utilities and shared functionality used across all test frameworks. Provides foundational utilities for data generation, configuration management, logging, and common async operations.

## Public API surface

`@kitiumai/test-core` now exposes a single curated entry point that aligns with the `docs/architecture-review.md` guidance. Import from the root and tree-shake only what you need:

```ts
import {
  createLogger,
  createConfigManager,
  waitFor,
  DataGenerators,
  Builder,
} from '@kitiumai/test-core';
```

The public surface is snapshot-tested to guard against accidental breakage.

## Installation

```bash
npm install @kitiumai/test-core
```

## Features

- 🔄 **Retry Logic** - Retry operations with exponential backoff
- ⏱️ **Async Utilities** - Wait for conditions, sleep, deferred promises
- 📊 **Data Generation** - Comprehensive test data factories and generators
- ⚙️ **Configuration** - Environment-aware configuration management
- 📝 **Logging** - Structured logging with levels and context
- 🔧 **Utilities** - Deep clone, merge, sanitization helpers

## Configuration with schema enforcement

The configuration manager validates inputs (including environment overrides) using a schema and returns an immutable snapshot suitable for global test setup.

```ts
import { createConfigManager } from '@kitiumai/test-core';

const config = createConfigManager({ baseUrl: 'https://example.com' });

const timeout = config.get('timeout');
const all = config.getAll(); // deeply frozen, safe to share globally
```

## Quick Start

```typescript
import { retry, waitUntil, sleep, DataGenerators, Factories } from '@kitiumai/test-core';

// Retry an operation
const result = await retry(() => fetch('/api/data'), { maxAttempts: 3, delayMs: 1000 });

// Wait for condition
await waitUntil(() => element.isVisible(), { timeoutMs: 5000 });

// Generate test data
const user = Factories.user({ email: 'test@example.com' });
const email = DataGenerators.email();
```

## Logging with deterministic retrieval

The test logger stores structured entries in-memory and exposes deterministic retrieval helpers.

```ts
import { createLogger, expectLogs, LogLevel } from '@kitiumai/test-core';

const logger = createLogger(LogLevel.INFO, { userId: '123' });

logger.info('user login');

const loginLogs = expectLogs(logger, { level: LogLevel.INFO, contains: ['login'], minimum: 1 });
```

## Framework recipes

Opinionated setups for Jest, Vitest, and Playwright live in [`docs/recipes/frameworks.md`](./docs/recipes/frameworks.md).

## API Reference

### Utilities

#### `retry<T>(fn, options?)`

Retry a function with exponential backoff.

**Parameters:**

- `fn: () => Promise<T>` - Function to retry
- `options?: { maxAttempts?: number; delayMs?: number; backoffMultiplier?: number; onRetry?: (attempt: number, error: Error) => void }`

**Returns:** `Promise<T>`

**Example:**

```typescript
const data = await retry(
  async () => {
    const response = await fetch('/api/data');
    if (!response.ok) throw new Error('Failed');
    return response.json();
  },
  {
    maxAttempts: 3,
    delayMs: 1000,
    backoffMultiplier: 2,
    onRetry: (attempt, error) => {
      console.log(`Attempt ${attempt} failed:`, error.message);
    },
  }
);
```

#### `waitUntil(condition, options?)`

Wait for a condition to become true with polling.

**Parameters:**

- `condition: () => boolean | Promise<boolean>` - Condition function
- `options?: { timeoutMs?: number; pollIntervalMs?: number; message?: string }`

**Returns:** `Promise<void>`

**Example:**

```typescript
await waitUntil(
  async () => {
    const response = await fetch('/api/status');
    const data = await response.json();
    return data.ready === true;
  },
  {
    timeoutMs: 10000,
    pollIntervalMs: 500,
    message: 'Service not ready',
  }
);
```

#### `sleep(ms)`

Sleep for specified milliseconds.

**Parameters:**

- `ms: number` - Milliseconds to sleep

**Returns:** `Promise<void>`

**Example:**

```typescript
await sleep(1000); // Wait 1 second
```

#### `deepClone<T>(obj)`

Deep clone an object.

**Parameters:**

- `obj: T` - Object to clone

**Returns:** `T`

**Example:**

```typescript
const original = { user: { name: 'John', age: 30 } };
const cloned = deepClone(original);
cloned.user.name = 'Jane'; // original is unchanged
```

#### `deepMerge<T>(target, source)`

Deep merge two objects.

**Parameters:**

- `target: T` - Target object
- `source: Partial<T>` - Source object

**Returns:** `T`

**Example:**

```typescript
const merged = deepMerge({ user: { name: 'John', age: 30 } }, { user: { age: 31 } });
// Result: { user: { name: 'John', age: 31 } }
```

#### `createDeferred<T>()`

Create a deferred promise with external resolve/reject control.

**Returns:** `{ promise: Promise<T>; resolve: (value: T) => void; reject: (reason?: unknown) => void }`

**Example:**

```typescript
const { promise, resolve, reject } = createDeferred<string>();

setTimeout(() => resolve('Done!'), 1000);
const result = await promise; // 'Done!'
```

#### `sanitizeForLogging(data, sensitiveKeys?)`

Sanitize data by redacting sensitive fields.

**Parameters:**

- `data: unknown` - Data to sanitize
- `sensitiveKeys?: string[]` - Keys to redact (default: ['password', 'token', 'secret', 'apiKey', 'authorization'])

**Returns:** `unknown`

**Example:**

```typescript
const sanitized = sanitizeForLogging({
  username: 'john',
  password: 'secret123',
  email: 'john@example.com',
});
// Result: { username: 'john', password: '***REDACTED***', email: 'john@example.com' }
```

### Data Generation

#### `DataGenerators`

Comprehensive data generation utilities.

**Available Generators:**

- `string(length?, charset?)` - Random string
- `number(min?, max?)` - Random number
- `email()` - Random email address
- `uuid()` - Random UUID
- `boolean()` - Random boolean
- `date(start?, end?)` - Random date
- `phoneNumber()` - Random phone number
- `username()` - Random username
- `url()` - Random URL
- `array<T>(generator, length?)` - Array of generated values
- `object<T>(generators)` - Object with generated values
- `firstName()` - Random first name
- `lastName()` - Random last name
- `fullName()` - Random full name
- `companyName()` - Random company name
- `address()` - Random street address
- `city()` - Random city
- `country()` - Random country
- `zipCode()` - Random ZIP code
- `ipAddress()` - Random IP address
- `creditCardNumber()` - Masked credit card number
- `slug()` - Random slug
- `locale()` - Random locale
- `isoTimestamp()` - ISO timestamp
- `pastDate(daysAgo?)` - Random past date
- `futureDate(daysFromNow?)` - Random future date
- `enum<T>(values)` - Random enum value
- `weighted<T>(options)` - Weighted random choice
- `hexColor()` - Random hex color
- `json<T>(depth?)` - Random JSON object

**Example:**

```typescript
import { DataGenerators } from '@kitiumai/test-core';

const email = DataGenerators.email(); // 'abc123@xyz456.com'
const uuid = DataGenerators.uuid(); // 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
const user = DataGenerators.object({
  name: () => DataGenerators.fullName(),
  email: () => DataGenerators.email(),
  age: () => DataGenerators.number(18, 65),
});
```

#### `createFactory<T>(defaultFactory)`

Create a factory function for generating test data.

**Parameters:**

- `defaultFactory: (seed: number) => T` - Factory function that uses seed

**Returns:** `(overrides?: Partial<T>) => T`

**Example:**

```typescript
const userFactory = createFactory((seed) => ({
  id: seed,
  email: `user${seed}@example.com`,
  name: `User ${seed}`,
}));

const user1 = userFactory(); // { id: 1, email: 'user1@example.com', name: 'User 1' }
const user2 = userFactory({ name: 'Custom Name' }); // { id: 2, email: 'user2@example.com', name: 'Custom Name' }
```

#### `createFactoryWithBuilder<T>(defaultFactory, relations?)`

Create a factory with relationship builders.

**Parameters:**

- `defaultFactory: (seed: number) => T` - Factory function
- `relations?: Record<string, (seed: number) => unknown>` - Relationship generators

**Returns:** `(overrides?: Partial<T> & Record<string, unknown>) => T`

**Example:**

```typescript
const postFactory = createFactoryWithBuilder((seed) => ({ id: seed, title: `Post ${seed}` }), {
  author: (seed) => ({ id: seed, name: `Author ${seed}` }),
});

const post = postFactory({ title: 'Custom Title' });
// { id: 1, title: 'Custom Title', author: { id: 1, name: 'Author 1' } }
```

#### `Factories`

Pre-built factory functions for common entities.

**Available Factories:**

- `Factories.user(overrides?)` - User factory
- `Factories.post(overrides?)` - Post factory
- `Factories.comment(overrides?)` - Comment factory
- `Factories.apiResponse(overrides?)` - API response factory
- `Factories.company(overrides?)` - Company factory
- `Factories.product(overrides?)` - Product factory
- `Factories.order(overrides?)` - Order factory
- `Factories.todo(overrides?)` - Todo factory
- `Factories.article(overrides?)` - Article factory
- `Factories.profile(overrides?)` - Profile factory

**Example:**

```typescript
import { Factories } from '@kitiumai/test-core';

const user = Factories.user({ email: 'custom@example.com' });
const post = Factories.post({ authorId: user.id });
```

### Configuration

#### `createConfigManager(initialConfig?)`

Create a configuration manager instance.

**Parameters:**

- `initialConfig?: TestConfig` - Initial configuration

**Returns:** `ConfigManager`

**Example:**

```typescript
import { createConfigManager } from '@kitiumai/test-core';

const config = createConfigManager({
  timeout: 30000,
  retries: 2,
  verbose: true,
});

config.set('baseUrl', 'http://localhost:3000');
const timeout = config.get('timeout');
```

#### `getConfigManager()`

Get the global configuration manager instance.

**Returns:** `ConfigManager`

**Example:**

```typescript
import { getConfigManager } from '@kitiumai/test-core';

const config = getConfigManager();
const baseUrl = config.get('baseUrl');
```

### Logging

#### `createLogger(level?, context?)`

Create a logger instance.

**Parameters:**

- `level?: LogLevel` - Log level (DEBUG, INFO, WARN, ERROR)
- `context?: LogContext` - Initial context

**Returns:** `Logger`

**Example:**

```typescript
import { createLogger, LogLevel } from '@kitiumai/test-core';

const logger = createLogger(LogLevel.DEBUG, { testId: 'test-123' });

logger.info('Test started', { userId: 'user-456' });
logger.error('Test failed', new Error('Something went wrong'), { step: 'login' });

const logs = logger.getLogs(LogLevel.ERROR);
logger.clear();
```

## Examples

### Retry with Backoff

```typescript
import { retry } from '@kitiumai/test-core';

const fetchWithRetry = async (url: string) => {
  return await retry(
    async () => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    },
    {
      maxAttempts: 5,
      delayMs: 1000,
      backoffMultiplier: 2,
      onRetry: (attempt, error) => {
        console.log(`Retry ${attempt}: ${error.message}`);
      },
    }
  );
};
```

### Wait for Async Condition

```typescript
import { waitUntil } from '@kitiumai/test-core';

// Wait for API to be ready
await waitUntil(
  async () => {
    try {
      const response = await fetch('/api/health');
      return response.ok;
    } catch {
      return false;
    }
  },
  {
    timeoutMs: 30000,
    pollIntervalMs: 1000,
    message: 'API not ready',
  }
);
```

### Generate Test Data

```typescript
import { DataGenerators, Factories } from '@kitiumai/test-core';

// Generate single values
const email = DataGenerators.email();
const phone = DataGenerators.phoneNumber();
const address = DataGenerators.address();

// Generate complex objects
const users = DataGenerators.array(() => Factories.user(), 10);

// Generate with relationships
const posts = DataGenerators.array(() => Factories.post({ authorId: DataGenerators.uuid() }), 5);
```

### Configuration Management

```typescript
import { getConfigManager } from '@kitiumai/test-core';

const config = getConfigManager();

// Set configuration
config.set('baseUrl', process.env.BASE_URL || 'http://localhost:3000');
config.set('timeout', 30000);

// Get configuration
const baseUrl = config.get('baseUrl');
const timeout = config.get('timeout');

// Merge configuration
config.merge({ timeout: 60000, retries: 3 });

// Get all configuration
const allConfig = config.getAll();
```

### Structured Logging

```typescript
import { createLogger, LogLevel } from '@kitiumai/test-core';

const logger = createLogger(LogLevel.INFO, {
  testSuite: 'user-service',
  environment: 'test',
});

logger.debug('Debug message', { userId: '123' });
logger.info('Test started', { testName: 'login-test' });
logger.warn('Deprecated API used', { endpoint: '/api/v1/users' });
logger.error('Test failed', new Error('Connection timeout'), {
  endpoint: '/api/users',
  attempt: 3,
});

// Get logs by level
const errorLogs = logger.getLogs(LogLevel.ERROR);
```

## TypeScript Support

Full TypeScript support with comprehensive type definitions.

```typescript
import type { TestConfig, LogLevel, LogContext } from '@kitiumai/test-core';
```

## License

MIT
