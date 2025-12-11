/**
 * Contract testing utilities for API contract validation
 * Inspired by Netflix's contract testing for microservices
 */

export type ContractRequest = {
  method: string;
  path: string;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  body?: unknown;
};

export type ContractResponse = {
  status: number;
  statusText?: string;
  headers?: Record<string, string>;
  body?: unknown;
};

export type APIContract = {
  name: string;
  version: string;
  description?: string;
  request: ContractRequest;
  response: ContractResponse;
  metadata?: {
    tags?: string[];
    author?: string;
    created?: string;
    updated?: string;
  };
};

export type ContractValidationResult = {
  /** Whether the contract validation passed */
  passed: boolean;
  /** Contract that was validated */
  contract: APIContract;
  /** Actual response received */
  actualResponse: ContractResponse;
  /** Validation errors */
  errors: ContractValidationError[];
  /** Validation warnings */
  warnings: ContractValidationWarning[];
  /** Timestamp of validation */
  timestamp: string;
};

export type ContractValidationError = {
  /** Type of validation error */
  type: 'status' | 'headers' | 'body' | 'schema';
  /** Human-readable description */
  message: string;
  /** Path to the field that failed (for body/schema validation) */
  path?: string;
  /** Expected value */
  expected?: unknown;
  /** Actual value */
  actual?: unknown;
};

export type ContractValidationWarning = {
  /** Type of validation warning */
  type: 'performance' | 'security' | 'deprecated';
  /** Human-readable description */
  message: string;
  /** Suggested action */
  suggestion?: string;
};

export type ContractTestSuite = {
  /** Suite name */
  name: string;
  /** API base URL */
  baseUrl: string;
  /** Contracts to test */
  contracts: APIContract[];
  /** Global headers to include in all requests */
  globalHeaders?: Record<string, string>;
  /** Timeout for requests */
  timeout?: number;
};

export type ContractTestSuiteResult = {
  /** Suite that was run */
  suite: ContractTestSuite;
  /** Results for each contract */
  results: ContractValidationResult[];
  /** Overall suite status */
  passed: boolean;
  /** Total contracts tested */
  totalContracts: number;
  /** Contracts that passed */
  passedContracts: number;
  /** Contracts that failed */
  failedContracts: number;
  /** Execution time */
  duration: number;
  /** Timestamp */
  timestamp: string;
};

/**
 * Generic HTTP client interface for cross-framework compatibility
 */
export type HttpClient = {
  request(config: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: unknown;
    timeout?: number;
  }): Promise<{
    status: number;
    statusText?: string;
    headers: Record<string, string>;
    body: unknown;
  }>;
};

/**
 * Create an API contract
 */
export function createContract(contract: APIContract): APIContract {
  return {
    ...contract,
    metadata: {
      tags: [],
      author: 'unknown',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      ...contract.metadata,
    },
  };
}

/**
 * Validate a response against a contract
 */
export async function validateContract(
  contract: APIContract,
  actualResponse: ContractResponse,
  options: {
    strictMode?: boolean;
    ignoreHeaders?: string[];
    bodySchema?: object;
  } = {}
): Promise<ContractValidationResult> {
  const { ignoreHeaders = [], bodySchema } = options;

  const errors: ContractValidationError[] = [];
  const warnings: ContractValidationWarning[] = [];

  // Validate status
  if (actualResponse.status !== contract.response.status) {
    errors.push({
      type: 'status',
      message: `Expected status ${contract.response.status}, got ${actualResponse.status}`,
      expected: contract.response.status,
      actual: actualResponse.status,
    });
  }

  // Validate headers
  if (contract.response.headers) {
    for (const [key, expectedValue] of Object.entries(contract.response.headers)) {
      if (ignoreHeaders.includes(key.toLowerCase())) {
        continue;
      }

      const actualValue = actualResponse.headers?.[key];
      if (actualValue !== expectedValue) {
        errors.push({
          type: 'headers',
          message: `Header '${key}' mismatch`,
          path: key,
          expected: expectedValue,
          actual: actualValue,
        });
      }
    }
  }

  // Validate body
  if (contract.response.body !== undefined) {
    const bodyMatch = deepEqual(contract.response.body, actualResponse.body);
    if (!bodyMatch) {
      errors.push({
        type: 'body',
        message: 'Response body does not match contract',
        expected: contract.response.body,
        actual: actualResponse.body,
      });
    }
  }

  // Schema validation (if provided)
  if (bodySchema && actualResponse.body) {
    try {
      const schemaErrors = validateAgainstSchema(actualResponse.body, bodySchema);
      errors.push(
        ...schemaErrors.map((error) => ({
          type: 'schema' as const,
          message: error.message,
          path: error.path,
        }))
      );
    } catch (_error) {
      warnings.push({
        type: 'deprecated',
        message: 'Schema validation failed',
        suggestion: 'Check schema definition',
      });
    }
  }

  // Performance warnings
  if (actualResponse.status >= 400) {
    warnings.push({
      type: 'performance',
      message: 'Response indicates error condition',
      suggestion: 'Check API error handling',
    });
  }

  // Security warnings
  if (
    actualResponse.headers &&
    !actualResponse.headers['content-type']?.includes('application/json')
  ) {
    warnings.push({
      type: 'security',
      message: 'Response missing Content-Type header',
      suggestion: 'Set appropriate Content-Type headers',
    });
  }

  return {
    passed: errors.length === 0,
    contract,
    actualResponse,
    errors,
    warnings,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Test a contract against a live API
 */
export async function testContract(
  contract: APIContract,
  httpClient: HttpClient,
  options: {
    baseUrl?: string;
    timeout?: number;
    headers?: Record<string, string>;
    bodySchema?: object;
  } = {}
): Promise<ContractValidationResult> {
  const { baseUrl = '', timeout = 5000, headers = {}, bodySchema } = options;

  // Build request URL
  const url = baseUrl + contract.request.path;

  // Add query parameters
  const urlObject = new URL(url);
  if (contract.request.query) {
    Object.entries(contract.request.query).forEach(([key, value]) => {
      urlObject.searchParams.set(key, String(value));
    });
  }

  // Make request
  const response = await httpClient.request({
    method: contract.request.method,
    url: urlObject.toString(),
    headers: {
      ...contract.request.headers,
      ...headers,
    },
    body: contract.request.body,
    timeout,
  });

  const actualResponse: ContractResponse = {
    status: response.status,
    ...(response.statusText && { statusText: response.statusText }),
    headers: response.headers,
    body: response.body,
  };

  return validateContract(contract, actualResponse, bodySchema !== undefined ? { bodySchema } : {});
}

/**
 * Run a contract test suite
 */
export async function runContractTestSuite(
  suite: ContractTestSuite,
  httpClient: HttpClient
): Promise<ContractTestSuiteResult> {
  const startTime = Date.now();
  const results: ContractValidationResult[] = [];

  for (const contract of suite.contracts) {
    try {
      const result = await testContract(contract, httpClient, {
        baseUrl: suite.baseUrl,
        ...(suite.timeout !== undefined && { timeout: suite.timeout }),
        ...(suite.globalHeaders !== undefined && { headers: suite.globalHeaders }),
      });
      results.push(result);
    } catch (error) {
      // Create failed result for network errors
      results.push({
        passed: false,
        contract,
        actualResponse: {
          status: 0,
          statusText: 'Network Error',
          body: null,
        },
        errors: [
          {
            type: 'status',
            message: `Request failed: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        warnings: [],
        timestamp: new Date().toISOString(),
      });
    }
  }

  const duration = Date.now() - startTime;
  const passedContracts = results.filter((r) => r.passed).length;
  const failedContracts = results.length - passedContracts;

  return {
    suite,
    results,
    passed: failedContracts === 0,
    totalContracts: results.length,
    passedContracts,
    failedContracts,
    duration,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generate contract test report
 */
export function generateContractReport(result: ContractTestSuiteResult): string {
  const lines: string[] = [];

  lines.push(`# Contract Test Report: ${result.suite.name}`);
  lines.push('');
  lines.push(`## Summary`);
  lines.push(`- **Status**: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
  lines.push(`- **Base URL**: ${result.suite.baseUrl}`);
  lines.push(`- **Total Contracts**: ${result.totalContracts}`);
  lines.push(`- **Passed**: ${result.passedContracts}`);
  lines.push(`- **Failed**: ${result.failedContracts}`);
  lines.push(`- **Duration**: ${result.duration}ms`);
  lines.push(`- **Timestamp**: ${result.timestamp}`);
  lines.push('');

  if (result.failedContracts > 0) {
    lines.push('## Failed Contracts');
    lines.push('');

    result.results.forEach((contractResult, index) => {
      if (!contractResult.passed) {
        lines.push(`### ${index + 1}. ${contractResult.contract.name}`);
        lines.push(
          `- **Endpoint**: ${contractResult.contract.request.method} ${contractResult.contract.request.path}`
        );
        lines.push(`- **Expected Status**: ${contractResult.contract.response.status}`);
        lines.push(`- **Actual Status**: ${contractResult.actualResponse.status}`);
        lines.push('');

        if (contractResult.errors.length > 0) {
          lines.push('**Errors:**');
          contractResult.errors.forEach((error) => {
            lines.push(`- ${error.message}`);
          });
          lines.push('');
        }

        if (contractResult.warnings.length > 0) {
          lines.push('**Warnings:**');
          contractResult.warnings.forEach((warning) => {
            lines.push(`- ${warning.message}`);
          });
          lines.push('');
        }
      }
    });
  }

  lines.push('## All Contracts');
  lines.push('');
  result.results.forEach((contractResult, index) => {
    const status = contractResult.passed ? '✅' : '❌';
    lines.push(
      `${index + 1}. ${status} ${contractResult.contract.name} (${contractResult.contract.request.method} ${contractResult.contract.request.path})`
    );
  });

  return lines.join('\n');
}

/**
 * Create contract from OpenAPI/Swagger spec
 */
export function createContractFromSpec(
  spec: any,
  path: string,
  method: string,
  responseCode = 200
): APIContract {
  // Simplified implementation - real version would parse OpenAPI spec
  const operation = spec.paths?.[path]?.[method.toLowerCase()];
  if (!operation) {
    throw new Error(`Operation not found: ${method} ${path}`);
  }

  const response = operation.responses?.[responseCode];
  if (!response) {
    throw new Error(`Response not found: ${responseCode}`);
  }

  return createContract({
    name: `${method.toUpperCase()} ${path}`,
    version: '1.0.0',
    description: operation.summary || operation.description,
    request: {
      method: method.toUpperCase(),
      path,
      headers: {
        'Content-Type': 'application/json',
      },
    },
    response: {
      status: responseCode,
      headers: {
        'Content-Type': 'application/json',
      },
      body: response.schema ? generateExampleFromSchema(response.schema) : undefined,
    },
  });
}

/**
 * Generate example data from JSON schema
 */
function generateExampleFromSchema(schema: any): unknown {
  if (!schema) {
    return undefined;
  }

  switch (schema.type) {
    case 'object': {
      const object: Record<string, unknown> = {};
      if (schema.properties) {
        Object.entries(schema.properties).forEach(([key, propertySchema]: [string, any]) => {
          object[key] = generateExampleFromSchema(propertySchema);
        });
      }
      return object;
    }

    case 'array':
      return [generateExampleFromSchema(schema.items)];

    case 'string':
      return schema.example || 'example string';

    case 'number':
    case 'integer':
      return schema.example || 42;

    case 'boolean':
      return schema.example || true;

    default:
      return null;
  }
}

/**
 * Deep equality check for objects
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }

  if (a === null || typeof a === 'undefined' || b === null || typeof b === 'undefined') {
    return a === b;
  }

  if (typeof a !== typeof b) {
    return false;
  }

  if (typeof a !== 'object') {
    return a === b;
  }

  if (Array.isArray(a) !== Array.isArray(b)) {
    return false;
  }

  if (Array.isArray(a)) {
    const bArray = b as unknown[];
    if (a.length !== bArray.length) {
      return false;
    }
    for (let index = 0; index < a.length; index++) {
      if (!deepEqual(a[index], bArray[index])) {
        return false;
      }
    }
    return true;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b as object);

  if (keysA.length !== keysB.length) {
    return false;
  }

  for (const key of keysA) {
    if (!(key in (b as object))) {
      return false;
    }
    if (!deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
      return false;
    }
  }

  return true;
}

/**
 * Validate object against JSON schema
 */
function validateAgainstSchema(
  data: unknown,
  schema: any
): Array<{ path: string; message: string }> {
  const errors: Array<{ path: string; message: string }> = [];

  function validate(value: unknown, currentSchema: any, path = ''): void {
    if (!currentSchema) {
      return;
    }

    switch (currentSchema.type) {
      case 'object':
        if (typeof value !== 'object' || value === null) {
          errors.push({ path, message: `Expected object, got ${typeof value}` });
          return;
        }

        if (currentSchema.required) {
          for (const required of currentSchema.required) {
            if (!(required in (value as object))) {
              errors.push({ path: `${path}.${required}`, message: 'Required property missing' });
            }
          }
        }

        if (currentSchema.properties) {
          Object.entries(currentSchema.properties).forEach(
            ([key, propertySchema]: [string, any]) => {
              const propertyPath = path ? `${path}.${key}` : key;
              validate((value as Record<string, unknown>)[key], propertySchema, propertyPath);
            }
          );
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          errors.push({ path, message: `Expected array, got ${typeof value}` });
          return;
        }

        if (currentSchema.items) {
          value.forEach((item, index) => {
            validate(item, currentSchema.items, `${path}[${index}]`);
          });
        }
        break;

      case 'string':
        if (typeof value !== 'string') {
          errors.push({ path, message: `Expected string, got ${typeof value}` });
        }
        break;

      case 'number':
      case 'integer':
        if (typeof value !== 'number') {
          errors.push({ path, message: `Expected number, got ${typeof value}` });
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push({ path, message: `Expected boolean, got ${typeof value}` });
        }
        break;
    }
  }

  validate(data, schema);
  return errors;
}

/**
 * HTTP client implementation using fetch
 */
export class FetchHttpClient implements HttpClient {
  async request(config: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: unknown;
    timeout?: number;
  }): Promise<{
    status: number;
    statusText?: string;
    headers: Record<string, string>;
    body: unknown;
  }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout || 5000);

    try {
      const response = await fetch(config.url, {
        method: config.method,
        ...(config.headers && { headers: config.headers }),
        ...(config.body !== undefined && { body: JSON.stringify(config.body) }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      let body: unknown;
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        body = await response.json();
      } else {
        body = await response.text();
      }

      return {
        status: response.status,
        statusText: response.statusText,
        headers,
        body,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
}
