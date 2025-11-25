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
   * Mock a GET request
   */
  mockGet(urlPattern: string | RegExp, response: HttpMockResponse): void {
    this.mock(urlPattern, (request) => {
      if (request.method !== 'GET') {
        throw new Error(`Expected GET request, got ${request.method}`);
      }
      return response;
    });
  }

  /**
   * Mock a POST request
   */
  mockPost(urlPattern: string | RegExp, response: HttpMockResponse): void {
    this.mock(urlPattern, (request) => {
      if (request.method !== 'POST') {
        throw new Error(`Expected POST request, got ${request.method}`);
      }
      return response;
    });
  }

  /**
   * Mock a PUT request
   */
  mockPut(urlPattern: string | RegExp, response: HttpMockResponse): void {
    this.mock(urlPattern, (request) => {
      if (request.method !== 'PUT') {
        throw new Error(`Expected PUT request, got ${request.method}`);
      }
      return response;
    });
  }

  /**
   * Mock a DELETE request
   */
  mockDelete(urlPattern: string | RegExp, response: HttpMockResponse): void {
    this.mock(urlPattern, (request) => {
      if (request.method !== 'DELETE') {
        throw new Error(`Expected DELETE request, got ${request.method}`);
      }
      return response;
    });
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
    return this.requests.filter((req) => regex.test(req.url));
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
 * Common response helpers
 */
export const HttpResponses = {
  ok: (body?: unknown): HttpMockResponse => ({
    status: 200,
    statusText: 'OK',
    headers: { 'Content-Type': 'application/json' },
    body,
  }),

  created: (body?: unknown): HttpMockResponse => ({
    status: 201,
    statusText: 'Created',
    headers: { 'Content-Type': 'application/json' },
    body,
  }),

  noContent: (): HttpMockResponse => ({
    status: 204,
    statusText: 'No Content',
  }),

  badRequest: (error?: string): HttpMockResponse => ({
    status: 400,
    statusText: 'Bad Request',
    headers: { 'Content-Type': 'application/json' },
    body: { error: error ?? 'Bad Request' },
  }),

  unauthorized: (): HttpMockResponse => ({
    status: 401,
    statusText: 'Unauthorized',
    headers: { 'Content-Type': 'application/json' },
    body: { error: 'Unauthorized' },
  }),

  forbidden: (): HttpMockResponse => ({
    status: 403,
    statusText: 'Forbidden',
    headers: { 'Content-Type': 'application/json' },
    body: { error: 'Forbidden' },
  }),

  notFound: (): HttpMockResponse => ({
    status: 404,
    statusText: 'Not Found',
    headers: { 'Content-Type': 'application/json' },
    body: { error: 'Not Found' },
  }),

  serverError: (error?: string): HttpMockResponse => ({
    status: 500,
    statusText: 'Internal Server Error',
    headers: { 'Content-Type': 'application/json' },
    body: { error: error ?? 'Internal Server Error' },
  }),
};
