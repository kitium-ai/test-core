# Framework Recipes

Opinionated examples for wiring `@kitiumai/test-core` into common test frameworks with consistent logging and configuration.

## Jest

```ts
// jest.setup.ts
import { createConfigManager, createLogger } from '@kitiumai/test-core';

const config = createConfigManager();
const logger = createLogger();

global.testConfig = config.getAll();
global.testLogger = logger;
```

```ts
// example.spec.ts
import { expectLogs, LogLevel } from '@kitiumai/test-core';

test('logs request lifecycle', () => {
  const logs = expectLogs(global.testLogger, {
    level: LogLevel.INFO,
    contains: ['request received'],
    minimum: 1,
  });

  expect(logs[0]?.context?.traceId).toBeDefined();
});
```

## Vitest

```ts
// vitest.setup.ts
import { beforeAll, afterAll } from 'vitest';
import { createConfigManager, createLogger } from '@kitiumai/test-core';

const config = createConfigManager();
const logger = createLogger();

beforeAll(() => {
  globalThis.testConfig = config.getAll();
  globalThis.testLogger = logger;
});

afterAll(async () => {
  await logger.close();
});
```

## Playwright

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test';
import { createConfigManager } from '@kitiumai/test-core';

const config = createConfigManager({ headless: true });

export default defineConfig({
  use: {
    headless: config.get('headless'),
    baseURL: config.get('baseUrl'),
  },
});
```

```ts
// tests/logger.fixture.ts
import { test as base } from '@playwright/test';
import { createLogger, expectLogs, LogLevel } from '@kitiumai/test-core';

export const test = base.extend<{ logger: ReturnType<typeof createLogger> }>({
  logger: async ({}, use) => {
    const logger = createLogger();
    await use(logger);
    const warnings = expectLogs(logger, { level: LogLevel.WARN });
    if (warnings.length > 0) {
      console.warn('Playwright warnings', warnings);
    }
    await logger.close();
  },
});
export const expect = test.expect;
```
