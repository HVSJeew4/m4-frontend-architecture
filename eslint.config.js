import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import storybook from 'eslint-plugin-storybook';

export default tseslint.config(
  {
    ignores: ['dist', 'storybook-static', 'coverage', 'submission', 'public/mockServiceWorker.js'],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-refresh': reactRefresh },
    extends: [reactHooks.configs.flat.recommended, jsxA11y.flatConfigs.strict],
    rules: {
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    files: ['*.config.{js,ts}', 'scripts/**/*.js'],
    languageOptions: { globals: globals.node },
  },
  storybook.configs['flat/recommended'],
);
