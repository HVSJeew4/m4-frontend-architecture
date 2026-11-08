// Automated accessibility audit in a real browser (unlike the jsdom tests, this includes colour
// contrast and layout):
//   - axe-core with the WCAG 2.0/2.1 A and AA rules, on every page and both open dialogs,
//     in the light and the dark theme, at phone (375 px) and desktop (1280 px) width;
//   - reflow (WCAG 1.4.10): no horizontal page scroll at 320 px wide;
//   - 200 % zoom (WCAG 1.4.4): a 1280 px screen at 200 % is a 640 px CSS viewport – no horizontal scroll;
//   - keyboard: Tab order and a visible focus indicator on every stop;
//   - every Storybook story in both themes (if storybook-static/ is built).
//
//   npm run build && npm run build-storybook && npm run a11y   → docs/a11y/axe-results.json
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import {
  BASE_URL,
  launchBrowser,
  signIn,
  startPreview,
  stopPreview,
  waitForPage,
} from './lib/browser.mjs';

const require = createRequire(import.meta.url);
const AXE_SOURCE = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

const THEMES = ['light', 'dark'];
const VIEWPORTS = [
  { name: 'phone', width: 375, height: 812 },
  { name: 'desktop', width: 1280, height: 800 },
];
// Each check: a path, and optionally something to click first (to audit an open dialog).
const CHECKS = [
  { name: 'Login', path: '/login', signedIn: false },
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Users (pages)', path: '/users' },
  { name: 'Users (all, virtual list)', path: '/users?view=all' },
  { name: 'Add user dialog', path: '/users?new=1' },
  {
    name: 'Delete user dialog',
    path: '/users?search=eden',
    click: 'button[aria-label="Delete user Eden Editor"]',
  },
  { name: 'Notifications', path: '/notifications' },
  { name: 'Not found', path: '/no-such-page' },
];
const REFLOW_WIDTHS = [320, 640];
const KEYBOARD_CHECKS = [
  { name: 'Login', path: '/login', signedIn: false },
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Users (pages)', path: '/users' },
];
const TAB_STOPS = 14;
const STORYBOOK_PORT = 6007;

/** Runs in the page: the focused element's accessible-ish name and whether focus is visible. */
function describeFocus() {
  const el = document.activeElement;
  // After the last control, Tab leaves the page for the browser's own UI (focus on <body>), then
  // wraps around – expected behaviour, not a missing focus indicator.
  if (!el || el === document.body) return { name: '(left the page)', role: '', visibleFocus: true };
  const style = getComputedStyle(el);
  // Tailwind's focus rings are box-shadows; native ones are outlines.
  const outline = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0;
  const ring = style.boxShadow && style.boxShadow !== 'none';
  const name = (
    el.getAttribute('aria-label') ||
    (el.labels && el.labels[0]?.textContent) ||
    el.textContent ||
    el.getAttribute('placeholder') ||
    ''
  )
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 40);
  return {
    name,
    role: el.getAttribute('role') || el.tagName.toLowerCase(),
    visibleFocus: Boolean(outline || ring),
  };
}

async function runAxe(page) {
  await page.evaluate(AXE_SOURCE);
  return page.evaluate(
    (tags) =>
      window.axe.run(document, { runOnly: { type: 'tag', values: tags } }).then((r) => ({
        violations: r.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          help: v.help,
          nodes: v.nodes.map((n) => n.target.join(' ')).slice(0, 5),
        })),
        passes: r.passes.length,
      })),
    WCAG_TAGS,
  );
}

async function openPage(browser, theme, viewport, check) {
  const page = await browser.newPage();
  await page.setViewport({ width: viewport.width, height: viewport.height });
  // Set the theme before the app loads (index.html reads this key before the first paint).
  await page.evaluateOnNewDocument((value) => {
    localStorage.setItem('adminflow:ui', JSON.stringify({ state: { theme: value }, version: 0 }));
  }, theme);
  if (check.signedIn !== false) await signIn(page);
  await page.goto(`${BASE_URL}${check.path}`, { waitUntil: 'networkidle0' });
  await waitForPage(page);
  if (check.click) {
    await page.click(check.click);
    await page.waitForSelector('[role="dialog"]');
  }
  return page;
}

/**
 * Every Storybook story in both themes (needs `npm run build-storybook`). Each story is opened in
 * Storybook's iframe with the theme set through the toolbar global.
 */
async function auditStorybook(browser) {
  if (!existsSync('storybook-static/index.json')) {
    console.log('– Storybook not built (npm run build-storybook): stories skipped');
    return [];
  }
  const { entries } = JSON.parse(readFileSync('storybook-static/index.json', 'utf8'));
  const stories = Object.values(entries).filter((e) => e.type === 'story');
  const server = await startPreview({ port: STORYBOOK_PORT, dir: 'storybook-static' });
  const results = [];
  try {
    for (const theme of THEMES) {
      for (const story of stories) {
        const page = await browser.newPage();
        await page.goto(
          `http://localhost:${STORYBOOK_PORT}/iframe.html?id=${story.id}&viewMode=story&globals=theme:${theme}`,
          { waitUntil: 'networkidle0' },
        );
        await page.waitForSelector('#storybook-root > *', { timeout: 20_000 });
        const { violations } = await runAxe(page);
        results.push({ story: `${story.title} / ${story.name}`, theme, violations });
        if (violations.length) {
          console.log(
            `✗ story ${story.title} / ${story.name} (${theme}): ${violations.map((v) => v.id).join(', ')}`,
          );
        }
        await page.close();
      }
    }
    console.log(
      `${results.some((r) => r.violations.length) ? '✗' : '✓'} ${stories.length} stories × ${THEMES.length} themes checked`,
    );
  } finally {
    stopPreview(server);
  }
  return results;
}

async function main() {
  const server = await startPreview();
  const browser = await launchBrowser();
  const results = [];
  try {
    for (const theme of THEMES) {
      for (const viewport of VIEWPORTS) {
        for (const check of CHECKS) {
          const page = await openPage(browser, theme, viewport, check);
          const { violations, passes } = await runAxe(page);
          results.push({
            check: check.name,
            path: check.path,
            theme,
            viewport: viewport.name,
            passes,
            violations,
          });
          console.log(
            `${violations.length ? '✗' : '✓'} ${check.name.padEnd(26)} ${theme.padEnd(5)} ${viewport.name.padEnd(7)} ` +
              (violations.length
                ? violations.map((v) => `${v.id} (${v.nodes.length})`).join(', ')
                : `${passes} rules passed`),
          );
          await page.close();
        }
      }
    }

    // Reflow and zoom: horizontal overflow at narrow CSS widths.
    const reflow = [];
    for (const width of REFLOW_WIDTHS) {
      for (const check of CHECKS.filter((c) => !c.click)) {
        const page = await openPage(browser, 'light', { width, height: 800 }, check);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        reflow.push({ check: check.name, width, overflowPx: overflow });
        console.log(
          `${overflow > 0 ? '✗' : '✓'} reflow ${String(width).padEnd(4)} ${check.name.padEnd(26)} ${overflow > 0 ? `${overflow}px horizontal scroll` : 'no horizontal scroll'}`,
        );
        await page.close();
      }
    }

    // Keyboard: Tab through each page, record the focus order and check every stop shows a
    // visible focus indicator (WCAG 2.4.3 focus order, 2.4.7 focus visible).
    const keyboard = [];
    for (const theme of THEMES) {
      for (const check of KEYBOARD_CHECKS) {
        const page = await openPage(browser, theme, VIEWPORTS[1], check);
        const stops = [];
        for (let i = 0; i < TAB_STOPS; i += 1) {
          await page.keyboard.press('Tab');
          stops.push(await page.evaluate(describeFocus));
        }
        const hidden = stops.filter((s) => !s.visibleFocus);
        keyboard.push({ check: check.name, theme, stops, withoutVisibleFocus: hidden.length });
        console.log(
          `${hidden.length ? '✗' : '✓'} keyboard ${check.name.padEnd(17)} ${theme.padEnd(5)} ${stops.length} Tab stops, ` +
            (hidden.length
              ? `no visible focus on: ${hidden.map((s) => s.name).join(', ')}`
              : 'all with visible focus'),
        );
        await page.close();
      }
    }

    const stories = await auditStorybook(browser);

    mkdirSync('docs/a11y', { recursive: true });
    writeFileSync(
      'docs/a11y/axe-results.json',
      `${JSON.stringify({ measuredAt: new Date().toISOString(), axeVersion: require('axe-core/package.json').version, tags: WCAG_TAGS, results, reflow, keyboard, stories }, null, 2)}\n`,
    );
    const failing =
      results.filter((r) => r.violations.length).length +
      reflow.filter((r) => r.overflowPx > 0).length +
      keyboard.filter((k) => k.withoutVisibleFocus).length +
      stories.filter((s) => s.violations.length).length;
    console.log(
      `\n${results.length} axe runs, ${reflow.length} reflow checks, ${keyboard.length} keyboard walks, ` +
        `${stories.length} story checks, ${failing} with problems. Wrote docs/a11y/axe-results.json`,
    );
    process.exitCode = failing ? 1 : 0;
  } finally {
    await browser.close();
    stopPreview(server);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
