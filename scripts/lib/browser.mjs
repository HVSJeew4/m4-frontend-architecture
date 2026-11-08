// Shared by scripts/a11y-audit.mjs and scripts/lighthouse.mjs: find Chrome, serve the production
// build, and sign in through the real login form.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

export const PORT = 4173;
export const BASE_URL = `http://localhost:${PORT}`;
// Demo login: the mock API accepts any registered email with an 8+ character password.
const DEMO_EMAIL = 'admin@adminflow.test';
const DEMO_PASSWORD = 'any-demo-password';

/** The installed Chrome or Edge (or the path in CHROME_PATH) – no browser download needed. */
export function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ];
  const found = candidates.find((path) => path && existsSync(path));
  if (!found) throw new Error('Chrome not found. Set CHROME_PATH to a Chrome or Edge executable.');
  return found;
}

export function launchBrowser() {
  return puppeteer.launch({ executablePath: findChrome(), headless: true });
}

/**
 * Starts `vite preview` and resolves once it answers. Serves dist/ (run `npm run build` first),
 * or another folder, e.g. storybook-static/.
 */
export async function startPreview({ port = PORT, dir = 'dist' } = {}) {
  // Vite's own script run with this Node: no shell (works the same on every OS, nothing to escape).
  const vite = fileURLToPath(new URL('../../node_modules/vite/bin/vite.js', import.meta.url));
  const args = [vite, 'preview', '--port', String(port), '--strictPort', '--outDir', dir];
  const server = spawn(process.execPath, args, { stdio: 'ignore' });
  const url = `http://localhost:${port}`;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      if ((await fetch(url)).ok) return server;
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  server.kill();
  throw new Error(`vite preview did not start on ${url}`);
}

export function stopPreview(server) {
  server.kill();
}

/** Waits until the page has its heading and no region is still loading. */
export async function waitForPage(page) {
  await page.waitForSelector('h1', { timeout: 20_000 });
  await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'), {
    timeout: 20_000,
  });
  await new Promise((resolve) => setTimeout(resolve, 300)); // let the last renders settle
}

/** Signs in through the login form, as a user would. The session lives in this tab. */
export async function signIn(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
  await page.type('input[type=email]', DEMO_EMAIL);
  await page.type('input[type=password]', DEMO_PASSWORD);
  await Promise.all([
    page.waitForFunction(() => location.pathname !== '/login'),
    page.keyboard.press('Enter'),
  ]);
  await waitForPage(page);
}
