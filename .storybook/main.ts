import type { StorybookConfig } from '@storybook/react-vite';

// Storybook reuses vite.config.ts, so Tailwind and the `@/` alias work in stories too.
const config: StorybookConfig = {
  stories: ['./*.mdx', '../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', 'msw-storybook-addon'],
  framework: { name: '@storybook/react-vite', options: {} },
  // Serves public/mockServiceWorker.js so the MSW addon can start its worker.
  staticDirs: ['../public'],
  core: { disableTelemetry: true },
};

export default config;
