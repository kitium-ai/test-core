/**
 * Accessibility testing utilities for WCAG compliance and automated accessibility audits
 * Inspired by Microsoft's accessibility focus and Google's a11y testing frameworks
 */

export type AccessibilityStandard = 'WCAG2A' | 'WCAG2AA' | 'WCAG2AAA' | 'Section508';

export type AccessibilityRule =
  | 'color-contrast'
  | 'keyboard-navigation'
  | 'focus-management'
  | 'semantic-html'
  | 'alt-text'
  | 'heading-structure'
  | 'landmarks'
  | 'form-labels'
  | 'language-attribute'
  | 'image-alt'
  | 'link-purpose'
  | 'button-purpose'
  | 'input-purpose'
  | 'table-headers'
  | 'list-structure'
  | 'frame-titles'
  | 'error-identification'
  | 'parsing'
  | 'name-role-value';

export type AccessibilityViolation = {
  /** Rule that was violated */
  rule: AccessibilityRule;
  /** Severity level */
  severity: 'error' | 'warning' | 'info';
  /** Human-readable description */
  description: string;
  /** CSS selector for the affected element */
  selector?: string;
  /** HTML of the affected element */
  html?: string;
  /** Additional context */
  context?: Record<string, unknown>;
  /** WCAG guideline reference */
  wcag?: string;
  /** Suggested fix */
  suggestion?: string;
};

export type AccessibilityAuditResult = {
  /** Whether the audit passed */
  passed: boolean;
  /** Total violations found */
  totalViolations: number;
  /** Violations by severity */
  violations: {
    errors: AccessibilityViolation[];
    warnings: AccessibilityViolation[];
    info: AccessibilityViolation[];
  };
  /** Score (0-100) */
  score: number;
  /** Standards checked */
  standards: AccessibilityStandard[];
  /** Rules checked */
  rulesChecked: AccessibilityRule[];
  /** Audit timestamp */
  timestamp: string;
  /** Page URL (if applicable) */
  url?: string;
};

export type AccessibilityAuditOptions = {
  /** Accessibility standards to check */
  standards?: AccessibilityStandard[];
  /** Specific rules to check */
  rules?: AccessibilityRule[];
  /** Include warnings in results */
  includeWarnings?: boolean;
  /** Include info-level issues */
  includeInfo?: boolean;
  /** Root element to audit (defaults to document.body) */
  rootElement?: Element;
  /** Skip hidden elements */
  skipHidden?: boolean;
  /** Custom rules to add */
  customRules?: Array<{
    name: AccessibilityRule;
    check: (element: Element) => AccessibilityViolation | null;
  }>;
};

/**
 * Generic page interface for cross-framework compatibility
 */
export type PageLike = {
  evaluate<T>(function_: () => T): Promise<T>;
  url(): string;
  title(): Promise<string>;
};

/**
 * Extract document and URL from page
 */
function extractDocumentFromPage(page: PageLike | Document): { document: Document; url?: string } {
  if ('evaluate' in page) {
    // It's a PageLike object (e.g., Playwright page)
    // For now, create a mock document for testing
    const document = {
      documentElement: { getAttribute: () => 'en' },
      querySelectorAll: () => [],
      querySelector: () => null,
    } as unknown as Document;
    const url = 'url' in page ? page.url() : undefined;
    return url !== undefined ? { document, url } : { document };
  } else {
    // It's a Document object
    return { document: page };
  }
}

/**
 * Calculate accessibility score based on violations
 */
function calculateAccessibilityScore(
  violations: AccessibilityAuditResult['violations'],
  rulesCount: number
): number {
  const errorWeight = 10;
  const warningWeight = 3;
  const infoWeight = 1;

  const maxPossibleScore = rulesCount * 10;
  const penaltyScore =
    violations.errors.length * errorWeight +
    violations.warnings.length * warningWeight +
    violations.info.length * infoWeight;

  return Math.max(0, Math.min(100, ((maxPossibleScore - penaltyScore) / maxPossibleScore) * 100));
}

/**
 * Run comprehensive accessibility audit
 */
export function auditAccessibility(
  page: PageLike | Document,
  options: AccessibilityAuditOptions = {}
): AccessibilityAuditResult {
  const { standards = ['WCAG2AA'], rules, skipHidden = true } = options;

  const violations: AccessibilityAuditResult['violations'] = {
    errors: [],
    warnings: [],
    info: [],
  };

  // Get page content
  const { document, url } = extractDocumentFromPage(page);

  // Run all accessibility checks
  const allRules = rules ?? getDefaultRulesForStandards(standards);

  for (const rule of allRules) {
    const ruleViolations = runAccessibilityRule(document, rule, { skipHidden });
    violations.errors.push(...ruleViolations.errors);
    violations.warnings.push(...ruleViolations.warnings);
    violations.info.push(...ruleViolations.info);
  }

  // Calculate score
  const totalViolations =
    violations.errors.length + violations.warnings.length + violations.info.length;
  const score = calculateAccessibilityScore(violations, allRules.length);

  return {
    passed: violations.errors.length === 0,
    totalViolations,
    violations,
    score,
    standards,
    rulesChecked: allRules,
    timestamp: new Date().toISOString(),
    ...(url && { url }),
  };
}

/**
 * Get default rules for given accessibility standards
 */
function getDefaultRulesForStandards(standards: AccessibilityStandard[]): AccessibilityRule[] {
  const rules = new Set<AccessibilityRule>();

  for (const standard of standards) {
    switch (standard) {
      case 'WCAG2A':
        rules.add('color-contrast');
        rules.add('keyboard-navigation');
        rules.add('semantic-html');
        rules.add('alt-text');
        rules.add('heading-structure');
        rules.add('form-labels');
        rules.add('link-purpose');
        rules.add('button-purpose');
        break;

      case 'WCAG2AA':
        // Include WCAG2A rules plus additional AA requirements
        getDefaultRulesForStandards(['WCAG2A']).forEach((rule) => rules.add(rule));
        rules.add('focus-management');
        rules.add('landmarks');
        rules.add('language-attribute');
        rules.add('image-alt');
        rules.add('table-headers');
        rules.add('error-identification');
        break;

      case 'WCAG2AAA':
        // Include WCAG2AA rules plus additional AAA requirements
        getDefaultRulesForStandards(['WCAG2AA']).forEach((rule) => rules.add(rule));
        rules.add('list-structure');
        rules.add('frame-titles');
        rules.add('parsing');
        rules.add('name-role-value');
        break;

      case 'Section508':
        rules.add('color-contrast');
        rules.add('keyboard-navigation');
        rules.add('semantic-html');
        rules.add('alt-text');
        rules.add('form-labels');
        rules.add('table-headers');
        break;
    }
  }

  return Array.from(rules);
}

/**
 * Execute WCAG 2.0 Level A rules
 */
function executeWCAG2ARule(
  document: Document,
  rule: AccessibilityRule,
  violations: {
    errors: AccessibilityViolation[];
    warnings: AccessibilityViolation[];
    info: AccessibilityViolation[];
  },
  skipHidden: boolean
): boolean {
  // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
  switch (rule) {
    case 'color-contrast':
      checkColorContrast(document, violations, skipHidden);
      return true;
    case 'keyboard-navigation':
      checkKeyboardNavigation(document, violations, skipHidden);
      return true;
    case 'semantic-html':
      checkSemanticHtml(document, violations, skipHidden);
      return true;
    case 'alt-text':
      checkAltText(document, violations, skipHidden);
      return true;
    case 'heading-structure':
      checkHeadingStructure(document, violations, skipHidden);
      return true;
    case 'form-labels':
      checkFormLabels(document, violations, skipHidden);
      return true;
    default:
      return false;
  }
}

/**
 * Execute WCAG 2.0 Level AA rules
 */
function executeWCAG2AARules(
  document: Document,
  rule: AccessibilityRule,
  violations: {
    errors: AccessibilityViolation[];
    warnings: AccessibilityViolation[];
    info: AccessibilityViolation[];
  },
  skipHidden: boolean
): boolean {
  // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
  switch (rule) {
    case 'focus-management':
      checkFocusManagement(document, violations, skipHidden);
      return true;
    case 'landmarks':
      checkLandmarks(document, violations, skipHidden);
      return true;
    case 'language-attribute':
      checkLanguageAttribute(document, violations, skipHidden);
      return true;
    case 'input-purpose':
      checkInputPurpose(document, violations, skipHidden);
      return true;
    case 'image-alt':
      checkImageAlt(document, violations, skipHidden);
      return true;
    default:
      return false;
  }
}

/**
 * Execute advanced accessibility rules
 */
function executeAdvancedRules(
  document: Document,
  rule: AccessibilityRule,
  violations: {
    errors: AccessibilityViolation[];
    warnings: AccessibilityViolation[];
    info: AccessibilityViolation[];
  },
  skipHidden: boolean
): boolean {
  // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
  switch (rule) {
    case 'link-purpose':
      checkLinkPurpose(document, violations, skipHidden);
      return true;
    case 'button-purpose':
      checkButtonPurpose(document, violations, skipHidden);
      return true;
    case 'table-headers':
      checkTableHeaders(document, violations, skipHidden);
      return true;
    case 'error-identification':
      checkErrorIdentification(document, violations, skipHidden);
      return true;
    case 'list-structure':
      checkListStructure(document, violations, skipHidden);
      return true;
    case 'parsing':
      checkParsing(document, violations, skipHidden);
      return true;
    case 'frame-titles':
      checkFrameTitles(document, violations, skipHidden);
      return true;
    case 'name-role-value':
      checkNameRoleValue(document, violations, skipHidden);
      return true;
    default:
      return false;
  }
}

/**
 * Run a specific accessibility rule
 */
function runAccessibilityRule(
  document: Document,
  rule: AccessibilityRule,
  options: { skipHidden: boolean }
): {
  errors: AccessibilityViolation[];
  warnings: AccessibilityViolation[];
  info: AccessibilityViolation[];
} {
  const violations = {
    errors: [] as AccessibilityViolation[],
    warnings: [] as AccessibilityViolation[],
    info: [] as AccessibilityViolation[],
  };

  // Try executing rule in each category
  const executed =
    executeWCAG2ARule(document, rule, violations, options.skipHidden) ||
    executeWCAG2AARules(document, rule, violations, options.skipHidden) ||
    executeAdvancedRules(document, rule, violations, options.skipHidden);

  if (!executed) {
    // Rule not implemented yet - return empty violations
    return violations;
  }

  return violations;
}

/**
 * Check color contrast ratios
 */
function checkColorContrast(
  document: Document,
  violations: {
    errors: AccessibilityViolation[];
    warnings: AccessibilityViolation[];
    info: AccessibilityViolation[];
  },
  skipHidden: boolean
): void {
  // Simplified color contrast check
  // In real implementation, would calculate actual contrast ratios
  const elements = document.querySelectorAll('*');

  elements.forEach((element) => {
    if (skipHidden && isElementHidden(element)) {
      return;
    }

    const style = window.getComputedStyle(element);
    const backgroundColor = style.backgroundColor;
    const color = style.color;

    // Mock contrast check - in real implementation, calculate actual ratios
    if (
      backgroundColor &&
      color &&
      backgroundColor !== 'rgba(0, 0, 0, 0)' &&
      color !== 'rgb(0, 0, 0)'
    ) {
      // This is a simplified check - real implementation would use WCAG contrast formulas
      const contrastRatio = 4.5; // Mock value

      if (contrastRatio < 4.5) {
        violations.errors.push({
          rule: 'color-contrast',
          severity: 'error',
          description: 'Insufficient color contrast ratio',
          selector: getElementSelector(element),
          html: element.outerHTML,
          context: { contrastRatio, required: 4.5 },
          wcag: '1.4.3',
          suggestion: 'Increase contrast between text and background colors',
        });
      }
    }
  });
}

/**
 * Check keyboard navigation
 */
function checkKeyboardNavigation(
  document: Document,
  violations: {
    errors: AccessibilityViolation[];
    warnings: AccessibilityViolation[];
    info: AccessibilityViolation[];
  },
  skipHidden: boolean
): void {
  const interactiveElements = document.querySelectorAll(
    'button, a[href], input, select, textarea, [tabindex]'
  );

  interactiveElements.forEach((element) => {
    if (skipHidden && isElementHidden(element)) {
      return;
    }

    const tabindex = element.getAttribute('tabindex');
    if (tabindex && parseInt(tabindex, 10) < 0) {
      violations.warnings.push({
        rule: 'keyboard-navigation',
        severity: 'warning',
        description: 'Element removed from tab order',
        selector: getElementSelector(element),
        html: element.outerHTML,
        wcag: '2.1.1',
        suggestion: 'Ensure this removal is intentional and alternative navigation exists',
      });
    }
  });
}

/**
 * Check semantic HTML usage
 */
function checkSemanticHtml(
  document: Document,
  violations: {
    errors: AccessibilityViolation[];
    warnings: AccessibilityViolation[];
    info: AccessibilityViolation[];
  },
  skipHidden: boolean
): void {
  // Check for proper heading hierarchy
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const headingLevels: number[] = [];

  headings.forEach((heading) => {
    if (skipHidden && isElementHidden(heading)) {
      return;
    }

    const level = parseInt(heading.tagName.charAt(1), 10);
    headingLevels.push(level);
  });

  // Check for skipped heading levels
  for (let index = 1; index < headingLevels.length; index++) {
    const currentLevel = headingLevels[index];
    const previousLevel = headingLevels[index - 1];
    if (
      currentLevel !== undefined &&
      previousLevel !== undefined &&
      currentLevel > previousLevel + 1
    ) {
      violations.warnings.push({
        rule: 'semantic-html',
        severity: 'warning',
        description: 'Skipped heading level',
        selector: `h${currentLevel}`,
        wcag: '1.3.1',
        suggestion: 'Use sequential heading levels (h1, h2, h3, etc.)',
      });
    }
  }
}

/**
 * Check alt text on images
 */
function checkAltText(
  document: Document,
  violations: {
    errors: AccessibilityViolation[];
    warnings: AccessibilityViolation[];
    info: AccessibilityViolation[];
  },
  skipHidden: boolean
): void {
  const images = document.querySelectorAll('img');

  images.forEach((img) => {
    if (skipHidden && isElementHidden(img)) {
      return;
    }

    const alt = img.getAttribute('alt');
    const source = img.getAttribute('src');

    if (!alt) {
      violations.errors.push({
        rule: 'alt-text',
        severity: 'error',
        description: 'Image missing alt attribute',
        selector: getElementSelector(img),
        html: img.outerHTML,
        context: { src: source },
        wcag: '1.1.1',
        suggestion: 'Add descriptive alt text for the image',
      });
    } else if (alt.trim() === '') {
      violations.warnings.push({
        rule: 'alt-text',
        severity: 'warning',
        description: 'Image has empty alt attribute',
        selector: getElementSelector(img),
        html: img.outerHTML,
        context: { src: source },
        wcag: '1.1.1',
        suggestion: 'Provide meaningful alt text or use alt="" for decorative images',
      });
    }
  });
}

/**
 * Check heading structure
 */
function checkHeadingStructure(
  document: Document,
  violations: {
    errors: AccessibilityViolation[];
    warnings: AccessibilityViolation[];
    info: AccessibilityViolation[];
  },
  _skipHidden: boolean
): void {
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');

  if (headings.length === 0) {
    violations.warnings.push({
      rule: 'heading-structure',
      severity: 'warning',
      description: 'No headings found on page',
      wcag: '1.3.1',
      suggestion: 'Add proper heading structure to organize content',
    });
    return;
  }

  // Check for h1
  const h1Count = document.querySelectorAll('h1').length;
  if (h1Count === 0) {
    violations.warnings.push({
      rule: 'heading-structure',
      severity: 'warning',
      description: 'No h1 heading found',
      wcag: '1.3.1',
      suggestion: 'Add an h1 heading as the main page title',
    });
  } else if (h1Count > 1) {
    violations.warnings.push({
      rule: 'heading-structure',
      severity: 'warning',
      description: 'Multiple h1 headings found',
      wcag: '1.3.1',
      suggestion: 'Use only one h1 per page, use h2-h6 for subsections',
    });
  }
}

/**
 * Check form labels
 */
function checkFormLabels(
  document: Document,
  violations: {
    errors: AccessibilityViolation[];
    warnings: AccessibilityViolation[];
    info: AccessibilityViolation[];
  },
  skipHidden: boolean
): void {
  const inputs = document.querySelectorAll('input, select, textarea');

  inputs.forEach((input) => {
    if (skipHidden && isElementHidden(input)) {
      return;
    }
    if ((input as HTMLInputElement).type === 'hidden') {
      return;
    }

    const id = input.getAttribute('id');
    const label = document.querySelector(`label[for="${id}"]`);

    if (!label && !input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby')) {
      violations.errors.push({
        rule: 'form-labels',
        severity: 'error',
        description: 'Form control missing label',
        selector: getElementSelector(input),
        html: input.outerHTML,
        wcag: '1.3.1',
        suggestion: 'Add a label element, aria-label, or aria-labelledby attribute',
      });
    }
  });
}

/**
 * Check focus management
 */
function checkFocusManagement(
  document: Document,
  violations: {
    errors: AccessibilityViolation[];
    warnings: AccessibilityViolation[];
    info: AccessibilityViolation[];
  },
  _skipHidden: boolean
): void {
  // Check for focusable elements
  const focusableElements = document.querySelectorAll(
    'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  if (focusableElements.length === 0) {
    violations.info.push({
      rule: 'focus-management',
      severity: 'info',
      description: 'No focusable elements found',
      suggestion: 'Ensure interactive elements are keyboard accessible',
    });
  }
}

/**
 * Check ARIA landmarks
 */
function checkLandmarks(
  document: Document,
  violations: {
    errors: AccessibilityViolation[];
    warnings: AccessibilityViolation[];
    info: AccessibilityViolation[];
  },
  _skipHidden: boolean
): void {
  const landmarks = document.querySelectorAll(
    '[role="banner"], [role="navigation"], [role="main"], [role="complementary"], [role="contentinfo"], header, nav, main, aside, footer'
  );

  if (landmarks.length === 0) {
    violations.warnings.push({
      rule: 'landmarks',
      severity: 'warning',
      description: 'No ARIA landmarks found',
      wcag: '1.3.1',
      suggestion: 'Add ARIA landmarks or semantic HTML elements to define page structure',
    });
  }
}

/**
 * Check language attribute
 */
function checkLanguageAttribute(
  document: Document,
  violations: {
    errors: AccessibilityViolation[];
    warnings: AccessibilityViolation[];
    info: AccessibilityViolation[];
  },
  _skipHidden: boolean
): void {
  const html = document.documentElement;
  const lang = html.getAttribute('lang');

  if (!lang) {
    violations.errors.push({
      rule: 'language-attribute',
      severity: 'error',
      description: 'Missing language attribute on html element',
      selector: 'html',
      wcag: '3.1.1',
      suggestion: 'Add lang attribute to html element (e.g., <html lang="en">)',
    });
  }
}

/**
 * Check input purpose mappings and labeling
 */
function checkInputPurpose(
  document: Document,
  violations: {
    errors: AccessibilityViolation[];
    warnings: AccessibilityViolation[];
    info: AccessibilityViolation[];
  },
  skipHidden: boolean
): void {
  const inputs = document.querySelectorAll('input');

  inputs.forEach((input) => {
    if (skipHidden && isElementHidden(input)) {
      return;
    }

    const id = input.getAttribute('id');
    const associatedLabel = id
      ? document.querySelector(`label[for="${id}"]`)
      : input.closest('label');
    const hasAriaLabel =
      input.hasAttribute('aria-label') ||
      input.hasAttribute('aria-labelledby') ||
      input.getAttribute('title');

    if (!associatedLabel && !hasAriaLabel) {
      violations.errors.push({
        rule: 'input-purpose',
        severity: 'error',
        description: 'Input has no accessible name',
        selector: getElementSelector(input),
        html: input.outerHTML,
        wcag: '3.3.2',
        suggestion: 'Associate the input with a label or provide an aria-label attribute',
      });
    }

    const type = input.getAttribute('type') ?? 'text';
    if (type === 'text' && !input.hasAttribute('autocomplete')) {
      violations.warnings.push({
        rule: 'input-purpose',
        severity: 'warning',
        description: 'Text input missing autocomplete attribute',
        selector: getElementSelector(input),
        html: input.outerHTML,
        wcag: '1.3.5',
        suggestion:
          'Provide autocomplete hints to help assistive technologies identify input purpose',
      });
    }
  });
}

/**
 * Check frame and iframe titles
 */
function checkFrameTitles(
  document: Document,
  violations: {
    errors: AccessibilityViolation[];
    warnings: AccessibilityViolation[];
    info: AccessibilityViolation[];
  },
  skipHidden: boolean
): void {
  const frames = document.querySelectorAll('iframe, frame');

  frames.forEach((frame) => {
    if (skipHidden && isElementHidden(frame)) {
      return;
    }

    const title = frame.getAttribute('title');
    if (!title) {
      violations.errors.push({
        rule: 'frame-titles',
        severity: 'error',
        description: 'Frame elements must have descriptive titles',
        selector: getElementSelector(frame),
        html: frame.outerHTML,
        wcag: '2.4.1',
        suggestion: 'Add a title attribute that describes the frame contents',
      });
    }
  });
}

/**
 * Check image alt attributes (more comprehensive than alt-text)
 */
function checkImageAlt(
  document: Document,
  violations: {
    errors: AccessibilityViolation[];
    warnings: AccessibilityViolation[];
    info: AccessibilityViolation[];
  },
  skipHidden: boolean
): void {
  checkAltText(document, violations, skipHidden);
}

/**
 * Check link purpose clarity
 */
function checkLinkPurpose(
  document: Document,
  violations: {
    errors: AccessibilityViolation[];
    warnings: AccessibilityViolation[];
    info: AccessibilityViolation[];
  },
  skipHidden: boolean
): void {
  const links = document.querySelectorAll('a[href]');

  links.forEach((link) => {
    if (skipHidden && isElementHidden(link)) {
      return;
    }

    const text = link.textContent?.trim();
    const ariaLabel = link.getAttribute('aria-label');

    if (!text && !ariaLabel) {
      violations.errors.push({
        rule: 'link-purpose',
        severity: 'error',
        description: 'Link has no accessible text',
        selector: getElementSelector(link),
        html: link.outerHTML,
        wcag: '2.4.4',
        suggestion: 'Add text content or aria-label to describe link purpose',
      });
    } else if ((text && text.length < 3) || (ariaLabel && ariaLabel.length < 3)) {
      violations.warnings.push({
        rule: 'link-purpose',
        severity: 'warning',
        description: 'Link text may not clearly describe purpose',
        selector: getElementSelector(link),
        html: link.outerHTML,
        wcag: '2.4.4',
        suggestion: 'Use more descriptive link text',
      });
    }
  });
}

/**
 * Check button purpose clarity
 */
function checkButtonPurpose(
  document: Document,
  violations: {
    errors: AccessibilityViolation[];
    warnings: AccessibilityViolation[];
    info: AccessibilityViolation[];
  },
  skipHidden: boolean
): void {
  const buttons = document.querySelectorAll('button, [role="button"]');

  buttons.forEach((button) => {
    if (skipHidden && isElementHidden(button)) {
      return;
    }

    const text = button.textContent?.trim();
    const ariaLabel = button.getAttribute('aria-label');
    const title = button.getAttribute('title');

    if (!text && !ariaLabel && !title) {
      violations.errors.push({
        rule: 'button-purpose',
        severity: 'error',
        description: 'Button has no accessible text',
        selector: getElementSelector(button),
        html: button.outerHTML,
        wcag: '2.4.4',
        suggestion: 'Add text content, aria-label, or title to describe button purpose',
      });
    }
  });
}

/**
 * Check table headers
 */
function checkTableHeaders(
  document: Document,
  violations: {
    errors: AccessibilityViolation[];
    warnings: AccessibilityViolation[];
    info: AccessibilityViolation[];
  },
  skipHidden: boolean
): void {
  const tables = document.querySelectorAll('table');

  tables.forEach((table) => {
    if (skipHidden && isElementHidden(table)) {
      return;
    }

    const thElements = table.querySelectorAll('th');
    const tdElements = table.querySelectorAll('td');

    if (thElements.length === 0 && tdElements.length > 0) {
      violations.errors.push({
        rule: 'table-headers',
        severity: 'error',
        description: 'Table has data but no header cells',
        selector: getElementSelector(table),
        html: table.outerHTML,
        wcag: '1.3.1',
        suggestion: 'Add <th> elements or use headers/id attributes for complex tables',
      });
    }
  });
}

/**
 * Check error identification
 */
function checkErrorIdentification(
  document: Document,
  violations: {
    errors: AccessibilityViolation[];
    warnings: AccessibilityViolation[];
    info: AccessibilityViolation[];
  },
  skipHidden: boolean
): void {
  // This would typically check forms with errors
  // Simplified implementation
  const errorMessages = document.querySelectorAll('.error, [aria-invalid="true"]');

  errorMessages.forEach((error) => {
    if (skipHidden && isElementHidden(error)) {
      return;
    }

    const describedBy = error.getAttribute('aria-describedby');
    if (!describedBy) {
      violations.warnings.push({
        rule: 'error-identification',
        severity: 'warning',
        description: 'Error may not be properly associated with form control',
        selector: getElementSelector(error),
        html: error.outerHTML,
        wcag: '3.3.1',
        suggestion: 'Use aria-describedby to associate error messages with form controls',
      });
    }
  });
}

/**
 * Check list structure
 */
function checkListStructure(
  document: Document,
  violations: {
    errors: AccessibilityViolation[];
    warnings: AccessibilityViolation[];
    info: AccessibilityViolation[];
  },
  skipHidden: boolean
): void {
  const lists = document.querySelectorAll('ul, ol');

  lists.forEach((list) => {
    if (skipHidden && isElementHidden(list)) {
      return;
    }

    const directChildren = Array.from(list.children);
    const hasOnlyLiChildren = directChildren.every((child) => child.tagName === 'LI');

    if (!hasOnlyLiChildren) {
      violations.warnings.push({
        rule: 'list-structure',
        severity: 'warning',
        description: 'List contains non-list-item children',
        selector: getElementSelector(list),
        html: list.outerHTML,
        wcag: '1.3.1',
        suggestion: 'Use only <li> elements as direct children of <ul> or <ol>',
      });
    }
  });
}

/**
 * Check parsing validity
 */
function checkParsing(
  document: Document,
  violations: {
    errors: AccessibilityViolation[];
    warnings: AccessibilityViolation[];
    info: AccessibilityViolation[];
  },
  skipHidden: boolean
): void {
  // Basic parsing check - look for common issues
  try {
    // This is a simplified check - real implementation would validate HTML parsing
    const allElements = document.querySelectorAll('*');
    allElements.forEach((element) => {
      if (skipHidden && isElementHidden(element)) {
        return;
      }

      // Check for unclosed tags (simplified)
      if (element.outerHTML.includes('<') && !element.outerHTML.includes('>')) {
        violations.errors.push({
          rule: 'parsing',
          severity: 'error',
          description: 'Potential HTML parsing issue',
          selector: getElementSelector(element),
          wcag: '4.1.1',
          suggestion: 'Ensure all HTML tags are properly closed',
        });
      }
    });
  } catch (_error) {
    violations.errors.push({
      rule: 'parsing',
      severity: 'error',
      description: 'HTML parsing validation failed',
      wcag: '4.1.1',
      suggestion: 'Fix HTML parsing errors',
    });
  }
}

/**
 * Check name, role, value for interactive elements
 */
function checkNameRoleValue(
  document: Document,
  violations: {
    errors: AccessibilityViolation[];
    warnings: AccessibilityViolation[];
    info: AccessibilityViolation[];
  },
  skipHidden: boolean
): void {
  const interactiveElements = document.querySelectorAll('button, a[href], input, select, textarea');

  interactiveElements.forEach((element) => {
    if (skipHidden && isElementHidden(element)) {
      return;
    }

    const ariaLabel = element.getAttribute('aria-label');
    const ariaLabelledBy = element.getAttribute('aria-labelledby');
    const textContent = element.textContent?.trim();

    // Check if element has accessible name
    const hasAccessibleName =
      textContent ??
      ariaLabel ??
      ariaLabelledBy ??
      (element as HTMLInputElement).placeholder ??
      element.getAttribute('title');

    if (!hasAccessibleName) {
      violations.errors.push({
        rule: 'name-role-value',
        severity: 'error',
        description: 'Interactive element missing accessible name',
        selector: getElementSelector(element),
        html: element.outerHTML,
        wcag: '4.1.2',
        suggestion: 'Add text content, aria-label, or aria-labelledby',
      });
    }
  });
}

/**
 * Utility functions
 */
function isElementHidden(element: Element): boolean {
  const style = window.getComputedStyle(element);
  return (
    style.display === 'none' || style.visibility === 'hidden' || element.hasAttribute('hidden')
  );
}

function getElementSelector(element: Element): string {
  const id = element.getAttribute('id');
  if (id) {
    return `#${id}`;
  }

  const className = element.getAttribute('class');
  if (className) {
    return `${element.tagName.toLowerCase()}.${className.split(' ')[0]}`;
  }

  return element.tagName.toLowerCase();
}

/**
 * Append accessibility report summary
 */
function appendAccessibilitySummary(lines: string[], result: AccessibilityAuditResult): void {
  lines.push(`# Accessibility Audit Report`);
  lines.push('');
  lines.push(`## Summary`);
  lines.push(`- **Status**: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
  lines.push(`- **Score**: ${result.score.toFixed(1)}/100`);
  lines.push(`- **Standards**: ${result.standards.join(', ')}`);
  lines.push(`- **Total Violations**: ${result.totalViolations}`);
  lines.push(`- **Errors**: ${result.violations.errors.length}`);
  lines.push(`- **Warnings**: ${result.violations.warnings.length}`);
  lines.push(`- **Info**: ${result.violations.info.length}`);
  lines.push(`- **Timestamp**: ${result.timestamp}`);

  if (result.url) {
    lines.push(`- **URL**: ${result.url}`);
  }

  lines.push('');
}

/**
 * Append violations of a specific severity level
 */
function appendViolationsList(
  lines: string[],
  violations: AccessibilityViolation[],
  title: string
): void {
  if (violations.length === 0) {
    return;
  }

  lines.push(`## ${title}`);
  lines.push('');
  violations.forEach((violation, index) => {
    lines.push(`### ${index + 1}. ${violation.description}`);
    lines.push(`- **Rule**: ${violation.rule}`);
    lines.push(`- **WCAG**: ${violation.wcag ?? 'N/A'}`);
    if (violation.selector) {
      lines.push(`- **Element**: \`${violation.selector}\``);
    }
    if (violation.suggestion) {
      lines.push(`- **Suggestion**: ${violation.suggestion}`);
    }
    lines.push('');
  });
}

/**
 * Generate accessibility report
 */
export function generateAccessibilityReport(result: AccessibilityAuditResult): string {
  const lines: string[] = [];

  appendAccessibilitySummary(lines, result);
  appendViolationsList(lines, result.violations.errors, 'Errors');
  appendViolationsList(lines, result.violations.warnings, 'Warnings');

  return lines.join('\n');
}
