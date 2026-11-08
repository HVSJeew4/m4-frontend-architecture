import type { Preview } from '@storybook/react-vite';
import { mswLoader } from 'msw-storybook-addon/csf3';
import { handlers } from '../src/mocks/handlers';
import { applyTheme, type ResolvedTheme } from '../src/stores/uiStore';
import '../src/index.css';

const preview: Preview = {
  loaders: [mswLoader()],
  // Toolbar switch: view (and a11y-check) every story in the light and the dark theme.
  globalTypes: {
    theme: {
      description: 'Colour theme',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'light' },
  decorators: [
    (Story, context) => {
      applyTheme(context.globals.theme as ResolvedTheme);
      return Story();
    },
  ],
  parameters: {
    // The app's mock API is available to every story; a story can override it.
    msw: handlers,
    // Fail on accessibility violations, not just list them.
    a11y: { test: 'error' },
    // Stories sit on the page background, like components in the app.
    backgrounds: { disable: true },
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },
};

export default preview;
