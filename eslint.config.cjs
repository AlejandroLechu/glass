const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  {
    files: ['src/**/*.js'],
    ignores: ['node_modules/**', 'pickleglass_web/**', 'functions/**'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'commonjs',
      globals: globals.node,
    },
    ...js.configs.recommended,
  },
];
