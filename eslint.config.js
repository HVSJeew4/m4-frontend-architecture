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
      // Tab panels (WAI-ARIA tabs pattern) and scrollable regions (axe: scrollable-region-focusable)
      // must be keyboard-focusable, so tabIndex={0} is allowed on those two roles.
      'jsx-a11y/no-noninteractive-tabindex': ['error', { tags: [], roles: ['tabpanel', 'region'] }],
      // `const { page, ...filters } = params` – dropping keys with a rest object is intentional.
      '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
    },
  },
  {
    files: ['*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
  },
  {
    // Scripts run in Node, but the functions they pass to page.evaluate() run in the browser.
    files: ['scripts/**/*.{js,mjs}'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
  storybook.configs['flat/recommended'],
);
