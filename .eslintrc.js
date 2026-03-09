module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'script',
  },
  rules: {
    'no-empty': ['error', { allowEmptyCatch: true }],
    'no-inner-declarations': 'off',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    semi: ['error', 'always'],
    quotes: ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
  },
  ignorePatterns: [
    'node_modules/',
    'test-results/',
    'playwright-report/',
    'dist/',
    'vendor/',
  ],
};
