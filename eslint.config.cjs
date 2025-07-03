module.exports = [
  {
    ignores: ['node_modules/**', 'pickleglass_web/**', 'functions/node_modules/**'],
  },
  {
    files: ['src/**/*.js', 'functions/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {},
  },
];
