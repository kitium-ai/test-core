/**
 * Framework-agnostic HTTP mocking utilities
 * Supports fetch API and XMLHttpRequest mocking
 */

export type HttpMockRequest = {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
};

export type HttpMockResponse = {
  status: number;
  statusText?: string;
  headers?: Record<string, string>;
  body?: unknown;
};

export type HttpMockHandler = (
  request: HttpMockRequest
) => HttpMockResponse | Promise<HttpMockResponse>;

/**
 * HTTP Mock Manager
 */
export class HttpMockManager {
  private readonly mocks: Map<string, HttpMockHandler> = new Map();
  private requests: HttpMockRequest[] = [];

  /**
   * Register a mock for a specific URL pattern
   */
  mock(urlPattern: string | RegExp, handler: HttpMockHandler): void {
    const key = urlPattern instanceof RegExp ? urlPattern.source : urlPattern;
    this.mocks.set(key, handler);
  }

  /**
   * Create a method-specific mock handler (DRY helper)
   */
  private createMethodMock(
    method: string,
    response: HttpMockResponse
  ): (request: HttpMockRequest) => HttpMockResponse {
    return (request: HttpMockRequest) => {
      if (request.method !== method) {
        throw new Error(`Expected ${method} request, got ${request.method}`);
      }
      return response;
    };
  }

  /**
   * Mock a GET request
   */
  mockGet(urlPattern: string | RegExp, response: HttpMockResponse): void {
    this.mock(urlPattern, this.createMethodMock('GET', response));
  }

  /**
   * Mock a POST request
   */
  mockPost(urlPattern: string | RegExp, response: HttpMockResponse): void {
    this.mock(urlPattern, this.createMethodMock('POST', response));
  }

  /**
   * Mock a PUT request
   */
  mockPut(urlPattern: string | RegExp, response: HttpMockResponse): void {
    this.mock(urlPattern, this.createMethodMock('PUT', response));
  }

  /**
   * Mock a DELETE request
   */
  mockDelete(urlPattern: string | RegExp, response: HttpMockResponse): void {
    this.mock(urlPattern, this.createMethodMock('DELETE', response));
  }

  /**
   * Mock a PATCH request
   */
  mockPatch(urlPattern: string | RegExp, response: HttpMockResponse): void {
    this.mock(urlPattern, this.createMethodMock('PATCH', response));
  }

  /**
   * Handle a request
   */
  async handle(request: HttpMockRequest): Promise<HttpMockResponse> {
    this.requests.push(request);

    for (const [pattern, handler] of this.mocks.entries()) {
      const regex = new RegExp(pattern);
      if (regex.test(request.url)) {
        return await handler(request);
      }
    }

    return {
      status: 404,
      statusText: 'Not Found',
      body: { error: 'No mock handler found' },
    };
  }

  /**
   * Get all recorded requests
   */
  getRequests(): HttpMockRequest[] {
    return [...this.requests];
  }

  /**
   * Get requests matching a URL pattern
   */
  getRequestsByUrl(urlPattern: string | RegExp): HttpMockRequest[] {
    const regex = urlPattern instanceof RegExp ? urlPattern : new RegExp(urlPattern);
    return this.requests.filter((request) => regex.test(request.url));
  }

  /**
   * Clear all mocks and requests
   */
  clear(): void {
    this.mocks.clear();
    this.requests = [];
  }
}

/**
 * Create HTTP mock manager
 */
export function createHttpMockManager(): HttpMockManager {
  return new HttpMockManager();
}

/**
 * Global HTTP mock manager
 */
let globalHttpMockManager: HttpMockManager | null = null;

export function getGlobalHttpMockManager(): HttpMockManager {
  globalHttpMockManager ??= new HttpMockManager();
  return globalHttpMockManager;
}

export function resetGlobalHttpMockManager(): void {
  globalHttpMockManager = null;
}

/**
 * Response builder helper (DRY)
 */
function createResponse(
  status: number,
  statusText: string,
  body?: unknown,
  includeHeaders = true
): HttpMockResponse {
  const response: HttpMockResponse = {
    status,
    statusText,
    body,
  };

  if (includeHeaders && body !== undefined) {
    response.headers = { 'Content-Type': 'application/json' };
  }

  return response;
}

/**
 * Error response builder helper (DRY)
 */
function createErrorResponse(status: number, statusText: string, error?: string): HttpMockResponse {
  return createResponse(status, statusText, { error: error ?? statusText });
}

/**
 * Common response helpers
 */
export const HttpResponses = {
  ok: (body?: unknown): HttpMockResponse => createResponse(200, 'OK', body),

  created: (body?: unknown): HttpMockResponse => createResponse(201, 'Created', body),

  noContent: (): HttpMockResponse => createResponse(204, 'No Content', undefined, false),

  badRequest: (error?: string): HttpMockResponse => createErrorResponse(400, 'Bad Request', error),

  unauthorized: (): HttpMockResponse => createErrorResponse(401, 'Unauthorized'),

  forbidden: (): HttpMockResponse => createErrorResponse(403, 'Forbidden'),

  notFound: (): HttpMockResponse => createErrorResponse(404, 'Not Found'),

  serverError: (error?: string): HttpMockResponse =>
    createErrorResponse(500, 'Internal Server Error', error),
};
