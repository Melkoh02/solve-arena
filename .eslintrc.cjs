module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    'react-native/no-inline-styles': 0,
    'no-unused-vars': 'off',
    'no-void': 'off',
    '@typescript-eslint/no-unused-vars': 'off',

    'no-multiple-empty-lines': [
      'error',
      {
        max: 1,
        maxEOF: 0,
        maxBOF: 0,
      },
    ],
  },
  ignorePatterns: ['*.config.js', 'postcss.config.js', 'tailwind.config.ts'],
};
