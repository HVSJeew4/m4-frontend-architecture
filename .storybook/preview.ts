import type { Preview } from '@storybook/react-vite';
import { mswLoader } from 'msw-storybook-addon/csf3';
import { handlers } from '../src/mocks/handlers';
import '../src/index.css';

const preview: Preview = {
  loaders: [mswLoader()],
  parameters: {
    // The app's mock API is available to every story; a story can override it.
    msw: handlers,
    // Fail on accessibility violations, not just list them.
    a11y: { test: 'error' },
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },
};

export default preview;
