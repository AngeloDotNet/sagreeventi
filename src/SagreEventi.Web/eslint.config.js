// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
// Import boundaries:
// - a feature never imports from another feature, so code shared by features goes to core/ or shared/;
// - core/ and shared/ never import from features/.
// Relative imports that reach features/ always contain the "features/" segment, so one pattern covers both cases.
const boundaries = [
  {
    files: ['src/app/features/**/*.ts'],
    message: 'A feature cannot import from another feature: move the shared code to core/ or shared/.',
  },
  {
    files: ['src/app/core/**/*.ts', 'src/app/shared/**/*.ts'],
    message: 'core/ and shared/ cannot import from features/.',
  },
].map(({ files, message }) => ({
  files,
  rules: {
    'no-restricted-imports': ['error', { patterns: [{ group: ['**/features/**'], message }] }],
  },
}));

module.exports = tseslint.config(
  { ignores: ['dist/**', '.angular/**', 'coverage/**', 'node_modules/**'] },
  {
    files: ['**/*.ts'],
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended, ...tseslint.configs.stylistic, ...angular.configs.tsRecommended],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: 'app', style: 'camelCase' }],
      '@angular-eslint/component-selector': ['error', { type: 'element', prefix: 'app', style: 'kebab-case' }],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  ...boundaries,
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {},
  },
);
