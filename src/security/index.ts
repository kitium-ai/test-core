/**
 * Security testing utilities
 * Inspired by Google's security testing frameworks and OWASP guidelines
 */

import { createLogger } from '../logger';
import { assertUnreachable } from '../utils/assert-never';

const securityLogger = createLogger(undefined, { metadata: { module: 'security-tests' } });

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
    test: async (context) => {
      const findings: SecurityFinding[] = [];
      const payloads = [
        "' OR '1'='1",
        "'; DROP TABLE users; --",
        "' UNION SELECT * FROM information_schema.tables; --",
        "admin'--",
        "1' OR '1' = '1",
      ];

      for (const payload of payloads) {
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
            findings.push({
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
            });
          }
        } catch (_error) {
          // Connection errors are not security findings
          continue;
        }
      }

      return findings;
    },
    remediation: 'Use parameterized queries, input validation, and prepared statements',
  },

  'xss-injection': {
    id: 'xss-injection',
    name: 'Cross-Site Scripting (XSS)',
    description: 'Tests for XSS vulnerabilities',
    severity: 'high',
    category: 'A03:2021-Injection',
    test: async (context) => {
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
    },
    remediation: 'Encode output, use CSP headers, validate and sanitize inputs',
  },

  'broken-auth': {
    id: 'broken-auth',
    name: 'Broken Authentication',
    description: 'Tests for authentication weaknesses',
    severity: 'critical',
    category: 'A07:2021-Identification and Authentication Failures',
    test: async (context) => {
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
    },
    remediation: 'Implement MFA, strong password policies, session management',
  },

  'security-headers': {
    id: 'security-headers',
    name: 'Security Headers',
    description: 'Checks for missing security headers',
    severity: 'medium',
    category: 'A05:2021-Security Misconfiguration',
    test: async (context) => {
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
    },
    remediation: 'Configure appropriate security headers in web server or application',
  },

  'sensitive-data-exposure': {
    id: 'sensitive-data-exposure',
    name: 'Sensitive Data Exposure',
    description: 'Checks for exposure of sensitive information',
    severity: 'high',
    category: 'A02:2021-Cryptographic Failures',
    test: async (context) => {
      const findings: SecurityFinding[] = [];

      try {
        const response = await context.httpClient.request({
          method: 'GET',
          url: context.target,
          ...(context.auth?.headers && { headers: context.auth.headers }),
          timeout: 5000,
        });

        const body = response.body.toLowerCase();

        // Check for sensitive data patterns
        const patterns = [
          {
            regex: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/,
            type: 'Credit Card Number',
            severity: 'critical' as const,
          },
          { regex: /\b\d{3}[\s-]?\d{3}[\s-]?\d{4}\b/, type: 'SSN', severity: 'critical' as const },
          {
            regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
            type: 'Email Address',
            severity: 'medium' as const,
          },
          {
            regex: /password[\s]*[=:][\s]*["']?[\w!@#$%^&*()_+{}|:<>?[\]\\;'/.,]+["']?/i,
            type: 'Password in Response',
            severity: 'high' as const,
          },
          {
            regex: /api[_-]?key[\s]*[=:][\s]*["']?[\w!@#$%^&*()_+{}|:<>?[\]\\;'/.,]+["']?/i,
            type: 'API Key',
            severity: 'high' as const,
          },
        ];

        for (const pattern of patterns) {
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
              remediation:
                'Encrypt sensitive data, use proper data masking, implement access controls',
              cweId: pattern.type === 'Credit Card Number' ? 'CWE-311' : 'CWE-200',
            });
          }
        }
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
    },
    remediation: 'Use encryption, data masking, proper access controls, and secure communication',
  },
};

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

    // Determine which rules to run
    const rulesToRun = options.rules || Object.values(SECURITY_RULES);

    // Filter by severity threshold
    const filteredRules = options.severityThreshold
      ? rulesToRun.filter(
          (rule) =>
            getSeverityWeight(rule.severity) >= getSeverityWeight(options.severityThreshold!)
        )
      : rulesToRun;

    // Run each rule
    for (const rule of filteredRules) {
      try {
        const ruleFindings = await Promise.race([
          rule.test(context),
          new Promise<SecurityFinding[]>((_, reject) =>
            setTimeout(() => reject(new Error(`Rule ${rule.id} timeout`)), options.timeout || 30000)
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
          url: target,
          evidence: 'Rule execution error',
        });
      }
    }

    // Run custom checks
    if (options.customChecks) {
      for (const check of options.customChecks) {
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
            url: target,
            evidence: 'Custom check execution error',
          });
        }
      }
    }

    const duration = Date.now() - startTime;
    const findingsBySeverity = findings.reduce(
      (accumulator, finding) => {
        accumulator[finding.severity] = (accumulator[finding.severity] || 0) + 1;
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

/**
 * Generate security test report
 */
export function generateSecurityReport(result: SecurityTestResult): string {
  const lines: string[] = [];

  lines.push('# Security Test Report');
  lines.push('');
  lines.push(`## Target: ${result.target}`);
  lines.push(`- **Status**: ${result.status === 'completed' ? '✅ COMPLETED' : '❌ FAILED'}`);
  lines.push(`- **Timestamp**: ${result.timestamp}`);
  lines.push(`- **Duration**: ${result.duration}ms`);
  lines.push(`- **Total Findings**: ${result.totalFindings}`);
  lines.push('');

  if (result.error) {
    lines.push(`## Error`);
    lines.push(`- ${result.error}`);
    lines.push('');
  }

  lines.push('## Findings by Severity');
  lines.push('');
  const severities: Array<SecurityFinding['severity']> = ['critical', 'high', 'medium', 'low'];
  severities.forEach((severity) => {
    const count = result.findingsBySeverity[severity] || 0;
    const icon = getSeverityIcon(severity);
    lines.push(`- ${icon} ${severity.toUpperCase()}: ${count}`);
  });
  lines.push('');

  if (result.findings.length > 0) {
    lines.push('## Security Findings');
    lines.push('');

    // Group findings by category
    const findingsByCategory = result.findings.reduce(
      (accumulator, finding) => {
        if (!accumulator[finding.category]) {
          accumulator[finding.category] = [];
        }
        accumulator[finding.category]!.push(finding);
        return accumulator;
      },
      {} as Record<string, SecurityFinding[]>
    );

    Object.entries(findingsByCategory).forEach(([category, categoryFindings]) => {
      lines.push(`### ${category}`);
      lines.push('');

      categoryFindings.forEach((finding) => {
        const severityIcon = getSeverityIcon(finding.severity);
        lines.push(`#### ${severityIcon} ${finding.title}`);
        lines.push(`- **Severity**: ${finding.severity.toUpperCase()}`);
        lines.push(`- **Description**: ${finding.description}`);
        if (finding.url) {
          lines.push(`- **URL**: ${finding.url}`);
        }
        if (finding.method) {
          lines.push(`- **Method**: ${finding.method}`);
        }
        if (finding.evidence) {
          lines.push(`- **Evidence**: ${finding.evidence}`);
        }
        if (finding.remediation) {
          lines.push(`- **Remediation**: ${finding.remediation}`);
        }
        if (finding.cweId) {
          lines.push(`- **CWE**: ${finding.cweId}`);
        }
        if (finding.references) {
          lines.push(`- **References**:`);
          finding.references.forEach((reference) => lines.push(`  - ${reference}`));
        }
        lines.push('');
      });
    });
  } else {
    lines.push('## ✅ No Security Issues Found');
    lines.push('');
    lines.push('All security tests passed successfully.');
  }

  return lines.join('\n');
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
function getSeverityIcon(severity: 'low' | 'medium' | 'high' | 'critical'): string {
  switch (severity) {
    case 'critical':
      return '🚨';
    case 'high':
      return '🔴';
    case 'medium':
      return '🟡';
    case 'low':
      return '🟢';
    default:
      return assertUnreachable(severity);
  }
}

function getSeverityWeight(severity: string): number {
  const weights = { low: 1, medium: 2, high: 3, critical: 4 };
  return weights[severity as keyof typeof weights] || 0;
}

function createMockHttpClient(): HttpClient {
  return {
    async request(options) {
      // Mock HTTP client - in real implementation, use actual HTTP client
      securityLogger.info('Mock HTTP request', { method: options.method, url: options.url });

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
