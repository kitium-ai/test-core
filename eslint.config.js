/**
 * ESLint configuration for @kitiumai/test-core
 * Uses @kitiumai/lint as the base configuration
 */

import { baseConfig, typeScriptConfig, jestConfig } from '@kitiumai/lint/eslint';

export default [
  ...baseConfig,
  ...typeScriptConfig,
  jestConfig,
  {
    ignores: ['dist/**', 'node_modules/**', '*.config.js', '*.config.cjs'],
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
