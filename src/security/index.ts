/**
 * Security testing utilities
 * Inspired by Google's security testing frameworks and OWASP guidelines
 */

import { createMockLogger } from '../logger';

const securityLogger = createMockLogger();

export type SecurityTestOptions = {
  /** Test scope */
  scope: 'api' | 'web' | 'mobile' | 'infrastructure';
  /** Security rules to check */
  rules?: SecurityRule[];
  /** Custom security checks */
  customChecks?: SecurityCheck[];
  /** Severity threshold */
  severityThreshold?: 'low' | 'medium' | 'high' | 'critical';
  /** Timeout for security scans */
  timeout?: number;
  /** Authentication context */
  auth?: {
    token?: string;
    cookies?: Record<string, string>;
    headers?: Record<string, string>;
  };
};

export type SecurityRule = {
  /** Rule ID */
  id: string;
  /** Rule name */
  name: string;
  /** Rule description */
  description: string;
  /** Severity level */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** OWASP category */
  category: OWASPCategory;
  /** Test function */
  test: (context: SecurityTestContext) => Promise<SecurityFinding[]>;
  /** Remediation advice */
  remediation?: string;
};

export type SecurityCheck = {
  /** Check name */
  name: string;
  /** Check function */
  check: (context: SecurityTestContext) => Promise<SecurityFinding[]>;
};

export type SecurityTestContext = {
  /** Target URL or endpoint */
  target: string;
  /** HTTP client for making requests */
  httpClient: HttpClient;
  /** Authentication context */
  auth?: SecurityTestOptions['auth'];
  /** Additional context data */
  data?: Record<string, unknown>;
};

export type SecurityFinding = {
  /** Finding ID */
  id: string;
  /** Finding title */
  title: string;
  /** Detailed description */
  description: string;
  /** Severity level */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** OWASP category */
  category: OWASPCategory;
  /** Affected URL/endpoint */
  url?: string;
  /** HTTP method */
  method?: string;
  /** Request payload that triggered the finding */
  payload?: string;
  /** Response details */
  response?: {
    status: number;
    headers: Record<string, string>;
    body?: string;
  };
  /** Evidence */
  evidence?: string;
  /** Remediation steps */
  remediation?: string;
  /** References */
  references?: string[];
  /** CVSS score (if applicable) */
  cvssScore?: number;
  /** CWE ID */
  cweId?: string;
};

export type SecurityTestResult = {
  /** Test target */
  target: string;
  /** Test timestamp */
  timestamp: string;
  /** Total findings */
  totalFindings: number;
  /** Findings by severity */
  findingsBySeverity: Record<string, number>;
  /** All security findings */
  findings: SecurityFinding[];
  /** Test duration */
  duration: number;
  /** Test status */
  status: 'completed' | 'failed' | 'timeout';
  /** Error message (if failed) */
  error?: string;
};

export type HttpClient = {
  /** Make HTTP request */
  request(options: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: string | Buffer;
    timeout?: number;
  }): Promise<{
    status: number;
    headers: Record<string, string>;
    body: string;
  }>;
};

export type OWASPCategory =
  | 'A01:2021-Broken Access Control'
  | 'A02:2021-Cryptographic Failures'
  | 'A03:2021-Injection'
  | 'A04:2021-Insecure Design'
  | 'A05:2021-Security Misconfiguration'
  | 'A06:2021-Vulnerable Components'
  | 'A07:2021-Identification and Authentication Failures'
  | 'A08:2021-Software Integrity Failures'
  | 'A09:2021-Security Logging Failures'
  | 'A10:2021-Server-Side Request Forgery';

/**
 * Predefined security rules based on OWASP Top 10
 */
export const SECURITY_RULES: Record<string, SecurityRule> = {
  'sql-injection': {
    id: 'sql-injection',
    name: 'SQL Injection',
    description: 'Tests for SQL injection vulnerabilities',
    severity: 'critical',
    category: 'A03:2021-Injection',
    test: testSqlInjection,
    remediation: 'Use parameterized queries, input validation, and prepared statements',
  },

  'xss-injection': {
    id: 'xss-injection',
    name: 'Cross-Site Scripting (XSS)',
    description: 'Tests for XSS vulnerabilities',
    severity: 'high',
    category: 'A03:2021-Injection',
    test: testXssInjection,
    remediation: 'Encode output, use CSP headers, validate and sanitize inputs',
  },

  'broken-auth': {
    id: 'broken-auth',
    name: 'Broken Authentication',
    description: 'Tests for authentication weaknesses',
    severity: 'critical',
    category: 'A07:2021-Identification and Authentication Failures',
    test: testBrokenAuth,
    remediation: 'Implement MFA, strong password policies, session management',
  },

  'security-headers': {
    id: 'security-headers',
    name: 'Security Headers',
    description: 'Checks for missing security headers',
    severity: 'medium',
    category: 'A05:2021-Security Misconfiguration',
    test: testSecurityHeaders,
    remediation: 'Configure appropriate security headers in web server or application',
  },

  'sensitive-data-exposure': {
    id: 'sensitive-data-exposure',
    name: 'Sensitive Data Exposure',
    description: 'Checks for exposure of sensitive information',
    severity: 'high',
    category: 'A02:2021-Cryptographic Failures',
    test: testSensitiveData,
    remediation: 'Use encryption, data masking, proper access controls, and secure communication',
  },
};

async function testSqlInjection(context: SecurityTestContext): Promise<SecurityFinding[]> {
  const findings: SecurityFinding[] = [];
  const payloads = [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "' UNION SELECT * FROM information_schema.tables; --",
    "admin'--",
    "1' OR '1' = '1",
  ];

  for (const payload of payloads) {
    const finding = await checkSqlPayload(payload, context);
    if (finding) {
      findings.push(finding);
    }
  }

  return findings;
}

async function checkSqlPayload(
  payload: string,
  context: SecurityTestContext
): Promise<SecurityFinding | null> {
  try {
    const response = await context.httpClient.request({
      method: 'POST',
      url: context.target,
      headers: {
        'Content-Type': 'application/json',
        ...context.auth?.headers,
      },
      body: JSON.stringify({ username: payload, password: 'test' }),
      timeout: 5000,
    });

    // Check for SQL error patterns in response
    if (
      response.body.match(/sql|mysql|postgresql|oracle|sqlite/i) ||
      response.body.match(/syntax error|unexpected token/i)
    ) {
      return {
        id: `sql-injection-${Date.now()}`,
        title: 'Potential SQL Injection Vulnerability',
        description: 'Server responded with database error when testing for SQL injection',
        severity: 'critical',
        category: 'A03:2021-Injection',
        url: context.target,
        method: 'POST',
        payload,
        response: {
          status: response.status,
          headers: response.headers,
          body: response.body.substring(0, 500),
        },
        evidence: 'Database error in response',
        remediation:
          'Use parameterized queries or prepared statements. Validate and sanitize all user inputs.',
        cweId: 'CWE-89',
      };
    }
  } catch (_error) {
    // Connection errors are not security findings
  }
  return null;
}

async function testXssInjection(context: SecurityTestContext): Promise<SecurityFinding[]> {
  const findings: SecurityFinding[] = [];
  const payloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    'javascript:alert("XSS")',
    '<svg onload=alert("XSS")>',
    '\'><script>alert("XSS")</script>',
  ];

  for (const payload of payloads) {
    try {
      const response = await context.httpClient.request({
        method: 'POST',
        url: context.target,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          ...context.auth?.headers,
        },
        body: `input=${encodeURIComponent(payload)}`,
        timeout: 5000,
      });

      // Check if payload is reflected in response without encoding
      if (response.body.includes(payload)) {
        findings.push({
          id: `xss-${Date.now()}`,
          title: 'Potential XSS Vulnerability',
          description: 'User input is reflected in response without proper encoding',
          severity: 'high',
          category: 'A03:2021-Injection',
          url: context.target,
          method: 'POST',
          payload,
          response: {
            status: response.status,
            headers: response.headers,
            body: response.body.substring(0, 500),
          },
          evidence: 'Unencoded user input in response',
          remediation: 'Encode user input, use Content Security Policy (CSP), validate input',
          cweId: 'CWE-79',
        });
      }
    } catch (_error) {
      continue;
    }
  }

  return findings;
}

async function testBrokenAuth(context: SecurityTestContext): Promise<SecurityFinding[]> {
  const findings: SecurityFinding[] = [];

  // Test weak passwords
  const weakPasswords = ['password', '123456', 'admin', 'letmein', 'qwerty'];

  for (const password of weakPasswords) {
    try {
      const response = await context.httpClient.request({
        method: 'POST',
        url: context.target,
        headers: {
          'Content-Type': 'application/json',
          ...context.auth?.headers,
        },
        body: JSON.stringify({ username: 'admin', password }),
        timeout: 5000,
      });

      if (response.status === 200) {
        findings.push({
          id: `weak-auth-${Date.now()}`,
          title: 'Weak Authentication',
          description: `Successfully authenticated with weak password: ${password}`,
          severity: 'critical',
          category: 'A07:2021-Identification and Authentication Failures',
          url: context.target,
          method: 'POST',
          payload: password,
          response: {
            status: response.status,
            headers: response.headers,
          },
          evidence: 'Authentication succeeded with weak credentials',
          remediation:
            'Implement strong password policies, multi-factor authentication, account lockout',
          cweId: 'CWE-287',
        });
      }
    } catch (_error) {
      continue;
    }
  }

  return findings;
}

async function testSecurityHeaders(context: SecurityTestContext): Promise<SecurityFinding[]> {
  const findings: SecurityFinding[] = [];

  try {
    const response = await context.httpClient.request({
      method: 'GET',
      url: context.target,
      ...(context.auth?.headers && { headers: context.auth.headers }),
      timeout: 5000,
    });

    const requiredHeaders = [
      { name: 'X-Frame-Options', description: 'Prevents clickjacking attacks' },
      { name: 'X-Content-Type-Options', description: 'Prevents MIME type sniffing' },
      { name: 'Content-Security-Policy', description: 'Mitigates XSS and injection attacks' },
      { name: 'Strict-Transport-Security', description: 'Enforces HTTPS' },
      { name: 'X-XSS-Protection', description: 'Enables XSS filtering in browsers' },
    ];

    for (const header of requiredHeaders) {
      if (!response.headers[header.name.toLowerCase()]) {
        findings.push({
          id: `missing-header-${header.name.toLowerCase()}-${Date.now()}`,
          title: `Missing Security Header: ${header.name}`,
          description: header.description,
          severity: 'medium',
          category: 'A05:2021-Security Misconfiguration',
          url: context.target,
          method: 'GET',
          response: {
            status: response.status,
            headers: response.headers,
          },
          evidence: `Header ${header.name} not present in response`,
          remediation: `Add ${header.name} header to HTTP responses`,
          references: ['https://owasp.org/www-project-secure-headers/'],
        });
      }
    }
  } catch (error) {
    findings.push({
      id: `headers-test-error-${Date.now()}`,
      title: 'Security Headers Test Failed',
      description: `Could not test security headers: ${error instanceof Error ? error.message : String(error)}`,
      severity: 'low',
      category: 'A05:2021-Security Misconfiguration',
      url: context.target,
      evidence: 'Test execution failed',
    });
  }

  return findings;
}

async function testSensitiveData(context: SecurityTestContext): Promise<SecurityFinding[]> {
  const findings: SecurityFinding[] = [];

  try {
    const response = await context.httpClient.request({
      method: 'GET',
      url: context.target,
      ...(context.auth?.headers && { headers: context.auth.headers }),
      timeout: 5000,
    });

    const body = response.body.toLowerCase();
    checkSensitivePatterns(body, context, response, findings);
  } catch (error) {
    findings.push({
      id: `sensitive-data-test-error-${Date.now()}`,
      title: 'Sensitive Data Test Failed',
      description: `Could not test for sensitive data exposure: ${error instanceof Error ? error.message : String(error)}`,
      severity: 'low',
      category: 'A02:2021-Cryptographic Failures',
      url: context.target,
      evidence: 'Test execution failed',
    });
  }

  return findings;
}

type SensitivePattern = {
  regex: RegExp;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  cweId: string;
};

function checkSensitivePatterns(
  body: string,
  context: SecurityTestContext,
  response: { status: number; headers: Record<string, string>; body: string },
  findings: SecurityFinding[]
): void {
  const patterns: SensitivePattern[] = [
    {
      regex: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/,
      type: 'Credit Card Number',
      severity: 'critical',
      cweId: 'CWE-311',
    },
    {
      regex: /\b\d{3}[\s-]?\d{3}[\s-]?\d{4}\b/,
      type: 'SSN',
      severity: 'critical',
      cweId: 'CWE-200',
    },
    {
      regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
      type: 'Email Address',
      severity: 'medium',
      cweId: 'CWE-200',
    },
    {
      regex: /password[\s]*[=:][\s]*["']?[\w!@#$%^&*()_+{}|:<>?[\]\\;'/.,]+["']?/i,
      type: 'Password in Response',
      severity: 'high',
      cweId: 'CWE-200',
    },
    {
      regex: /api[_-]?key[\s]*[=:][\s]*["']?[\w!@#$%^&*()_+{}|:<>?[\]\\;'/.,]+["']?/i,
      type: 'API Key',
      severity: 'high',
      cweId: 'CWE-200',
    },
  ];

  for (const pattern of patterns) {
    if (checkSinglePattern(body, pattern, context, response, findings)) {
      // Optionally break if finding per pattern is enough?
      // But we want all instances.
    }
  }
}

function checkSinglePattern(
  body: string,
  pattern: SensitivePattern,
  context: SecurityTestContext,
  response: { status: number; headers: Record<string, string>; body: string },
  findings: SecurityFinding[]
): boolean {
  const matches = body.match(new RegExp(pattern.regex, 'g'));
  if (matches) {
    findings.push({
      id: `sensitive-data-${pattern.type.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      title: `Sensitive Data Exposure: ${pattern.type}`,
      description: `Found ${matches.length} instance(s) of ${pattern.type} in response`,
      severity: pattern.severity,
      category: 'A02:2021-Cryptographic Failures',
      url: context.target,
      method: 'GET',
      response: {
        status: response.status,
        headers: response.headers,
        body: response.body.substring(0, 500),
      },
      evidence: `Pattern match: ${pattern.regex}`,
      remediation: 'Encrypt sensitive data, use proper data masking, implement access controls',
      cweId: pattern.cweId,
    });
    return true;
  }
  return false;
}

/**
 * Run security tests
 */
export async function runSecurityTests(
  target: string,
  options: SecurityTestOptions = { scope: 'api' }
): Promise<SecurityTestResult> {
  const startTime = Date.now();
  const findings: SecurityFinding[] = [];

  try {
    const httpClient = createMockHttpClient();
    const context: SecurityTestContext = {
      target,
      httpClient,
      auth: options.auth,
    };

    const rulesToRun = resolveSecurityRules(options);
    const findingsFromRules = await executeSecurityRules(rulesToRun, context, options.timeout);
    findings.push(...findingsFromRules);

    if (options.customChecks) {
      const findingsFromCustom = await executeCustomChecks(options.customChecks, context);
      findings.push(...findingsFromCustom);
    }

    const duration = Date.now() - startTime;
    return aggregateSecurityResults(target, findings, duration);
  } catch (error) {
    return {
      target,
      timestamp: new Date().toISOString(),
      totalFindings: findings.length,
      findingsBySeverity: {},
      findings,
      duration: Date.now() - startTime,
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function resolveSecurityRules(options: SecurityTestOptions): SecurityRule[] {
  const rulesToRun = options.rules ?? Object.values(SECURITY_RULES);

  if (options.severityThreshold) {
    const threshold = options.severityThreshold;
    return rulesToRun.filter(
      (rule) => getSeverityWeight(rule.severity) >= getSeverityWeight(threshold)
    );
  }

  return rulesToRun;
}

async function executeSecurityRules(
  rules: SecurityRule[],
  context: SecurityTestContext,
  timeout = 30000
): Promise<SecurityFinding[]> {
  const findings: SecurityFinding[] = [];

  for (const rule of rules) {
    try {
      const ruleFindings = await Promise.race([
        rule.test(context),
        new Promise<SecurityFinding[]>((_resolve, reject) =>
          setTimeout(() => reject(new Error(`Rule ${rule.id} timeout`)), timeout)
        ),
      ]);

      findings.push(...ruleFindings);
    } catch (error) {
      findings.push({
        id: `rule-error-${rule.id}-${Date.now()}`,
        title: `Rule Execution Failed: ${rule.name}`,
        description: `Failed to execute security rule: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'low',
        category: rule.category,
        url: context.target,
        evidence: 'Rule execution error',
      });
    }
  }

  return findings;
}

async function executeCustomChecks(
  checks: SecurityCheck[],
  context: SecurityTestContext
): Promise<SecurityFinding[]> {
  const findings: SecurityFinding[] = [];

  for (const check of checks) {
    try {
      const checkFindings = await check.check(context);
      findings.push(...checkFindings);
    } catch (error) {
      findings.push({
        id: `custom-check-error-${check.name}-${Date.now()}`,
        title: `Custom Check Failed: ${check.name}`,
        description: `Failed to execute custom security check: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'low',
        category: 'A05:2021-Security Misconfiguration',
        url: context.target,
        evidence: 'Custom check execution error',
      });
    }
  }

  return findings;
}

function aggregateSecurityResults(
  target: string,
  findings: SecurityFinding[],
  duration: number
): SecurityTestResult {
  const findingsBySeverity = findings.reduce(
    (accumulator, finding) => {
      accumulator[finding.severity] = (accumulator[finding.severity] ?? 0) + 1;
      return accumulator;
    },
    {} as Record<string, number>
  );

  return {
    target,
    timestamp: new Date().toISOString(),
    totalFindings: findings.length,
    findingsBySeverity,
    findings,
    duration,
    status: 'completed',
  };
}

/**
 * Generate security test report
 */
export function generateSecurityReport(result: SecurityTestResult): string {
  const lines: string[] = [];

  lines.push(`# Security Test Report: ${result.target}`);
  lines.push('');

  appendSecuritySummary(lines, result);
  appendSeverityBreakdown(lines, result);
  appendSecurityFindings(lines, result);

  return lines.join('\n');
}

function appendSecuritySummary(lines: string[], result: SecurityTestResult): void {
  lines.push('## Summary');
  lines.push(`- **Status**: ${result.status === 'completed' ? '✅ COMPLETED' : '❌ FAILED'}`);
  lines.push(`- **Duration**: ${result.duration}ms`);
  lines.push(`- **Total Findings**: ${result.totalFindings}`);
  lines.push(`- **Timestamp**: ${result.timestamp}`);
  lines.push('');
}

function appendSeverityBreakdown(lines: string[], result: SecurityTestResult): void {
  if (result.totalFindings > 0) {
    lines.push('## Findings by Severity');
    Object.entries(result.findingsBySeverity).forEach(([severity, count]) => {
      lines.push(`- **${severity}**: ${count}`);
    });
    lines.push('');
  }
}

function appendSecurityFindings(lines: string[], result: SecurityTestResult): void {
  if (result.findings.length > 0) {
    lines.push('## Detailed Findings');
    lines.push('');

    // Sort by severity
    result.findings
      .sort((a, b) => getSeverityWeight(b.severity) - getSeverityWeight(a.severity))
      .forEach((finding, index) => {
        lines.push(`### ${index + 1}. [${finding.severity.toUpperCase()}] ${finding.title}`);
        lines.push(`- **Category**: ${finding.category}`);
        lines.push(`- **Description**: ${finding.description}`);
        if (finding.cweId) {
          lines.push(`- **CWE**: ${finding.cweId}`);
        }
        lines.push(`- **Remediation**: ${finding.remediation}`);

        if (finding.url) {
          lines.push(`- **URL**: ${finding.url}`);
        }
        if (finding.method) {
          lines.push(`- **Method**: ${finding.method}`);
        }

        lines.push('');
      });
  } else {
    lines.push('## ✅ No Security Issues Found');
    lines.push('');
    lines.push('All security tests passed successfully.');
  }
}

/**
 * Create custom security rule
 */
export function createSecurityRule(rule: Omit<SecurityRule, 'id'>): SecurityRule {
  return {
    ...rule,
    id: `custom-${Date.now()}`,
  };
}

/**
 * Utility functions
 */
function getSeverityWeight(severity: string): number {
  const weights = { low: 1, medium: 2, high: 3, critical: 4 };
  return weights[severity as keyof typeof weights] || 0;
}

function createMockHttpClient(): HttpClient {
  return {
    async request(options) {
      // Mock HTTP client - in real implementation, use actual HTTP client
      securityLogger.info('Mock HTTP request', { method: options.method, url: options.url });

      // Simulate async network delay
      await new Promise<void>((resolve) => setTimeout(resolve, 10));

      // Simulate different responses based on URL and payload
      if (options.body?.includes("' OR '1'='1")) {
        return {
          status: 500,
          headers: { 'content-type': 'text/plain' },
          body: 'SQL syntax error: unexpected token',
        };
      }

      if (options.body?.includes('<script>')) {
        return {
          status: 200,
          headers: { 'content-type': 'text/html' },
          body: `<html><body>User input: ${options.body}</body></html>`,
        };
      }

      return {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'x-frame-options': 'DENY',
          'content-security-policy': "default-src 'self'",
        },
        body: '{"message": "success"}',
      };
    },
  };
}
