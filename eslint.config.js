/**
 * ESLint configuration for @kitiumai/test-core
 * Uses @kitiumai/lint as the base configuration
 */

import { eslintBaseConfig, eslintJestConfig, eslintTypeScriptConfig } from '@kitiumai/lint';

// Filter out problematic config and reapply with fixes
const baseConfigFiltered = eslintBaseConfig.map((config) => {
  if (config.rules?.['no-restricted-imports']) {
    const { 'no-restricted-imports': _, ...rest } = config.rules;
    return { ...config, rules: rest };
  }
  return config;
});

export default [
  ...baseConfigFiltered,
  ...eslintTypeScriptConfig,
  eslintJestConfig,
  {
    ignores: ['dist/**', 'node_modules/**', '*.config.js', '*.config.cjs', '*.d.ts'],
  },
  {
    name: 'test-core-no-restricted-imports-fix',
    rules: {
      // Fix no-restricted-imports rule format for ESLint 9
      'no-restricted-imports': [
        'warn',
        {
          paths: [
            {
              name: '../../*',
              message: 'Prefer module aliases over deep relative imports for maintainability.',
            },
            {
              name: '../../../*',
              message: 'Prefer module aliases over deep relative imports for maintainability.',
            },
          ],
        },
      ],
    },
  },
  {
    name: 'test-core-overrides',
    files: ['**/*.{ts,tsx}'],
    rules: {
      // Allow higher complexity for utility functions
      complexity: ['warn', 15],
      'max-statements': ['warn', 25],
      // Allow bitwise operators in data generators (UUID generation)
      'no-bitwise': 'off',
      // Allow non-null assertions in data generators
      '@typescript-eslint/no-non-null-assertion': 'warn',
      // Allow any type in utility functions
      '@typescript-eslint/no-explicit-any': 'warn',
      // Relax naming convention for local variables
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'variable',
          modifiers: ['const'],
          format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
        },
        {
          selector: 'variable',
          format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
          filter: {
            regex: '^(result|hasResult|conditionResult|sourceValue|targetValue)$',
            match: true,
          },
        },
      ],
      // Disable indent rule - let prettier handle it
      indent: 'off',
      // Allow nullish coalescing preference warnings
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
    },
  },
];
