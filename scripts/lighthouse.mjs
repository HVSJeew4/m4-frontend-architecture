// Lighthouse on the production build, mobile and desktop, for /login, /dashboard and /users.
//
//   npm run build && npm run lighthouse
//
// - /login is a first visit: Lighthouse clears all storage and the cache (its default).
// - /dashboard and /users need a session: the script signs in through the real form, clears only
//   the HTTP cache (so every script is downloaded again, under throttling), and tells Lighthouse
//   not to clear storage (that would delete the session). So these are "signed-in user, cold
//   cache" measurements.
// - Mobile = Lighthouse's default (simulated slow 4G, 4× CPU slowdown); desktop = its desktop config.
//
// - Each page runs LH_RUNS times (default 3) and the run with the median performance score is
//   kept: single mobile runs vary by ~10 points on the same build (Total Blocking Time depends on
//   what else the machine is doing), so one run proves nothing. All scores are recorded.
//
// Output: docs/lighthouse/*.html (the median run's report, not committed), summary.json and
// lighthouse-report.pdf (summary page + every median report) in docs/lighthouse/.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import { PDFDocument } from 'pdf-lib';
import { BASE_URL, launchBrowser, signIn, startPreview, stopPreview } from './lib/browser.mjs';

const OUT_DIR = 'docs/lighthouse';
const RUNS = Math.max(1, Number(process.env.LH_RUNS) || 3);
const LIGHTHOUSE_VERSION = JSON.parse(
  readFileSync('node_modules/lighthouse/package.json', 'utf8'),
).version;
// For experiments: LH_ONLY=mobile-dashboard runs just that one (the committed report uses all).
const ONLY = process.env.LH_ONLY;
// No SEO category: this is a private app behind a login, and public/robots.txt deliberately
// blocks indexing (which Lighthouse's SEO category would count against it).
const CATEGORIES = ['performance', 'accessibility', 'best-practices'];
const PAGES = [
  { name: 'login', path: '/login', signedIn: false },
  { name: 'dashboard', path: '/dashboard', signedIn: true },
  { name: 'users', path: '/users', signedIn: true },
];
const FORM_FACTORS = [
  { name: 'mobile', config: undefined },
  { name: 'desktop', config: desktopConfig },
];
const METRICS = {
  'first-contentful-paint': 'FCP',
  'largest-contentful-paint': 'LCP',
  'total-blocking-time': 'TBT',
  'cumulative-layout-shift': 'CLS',
  'speed-index': 'Speed Index',
};

async function audit(browser, formFactor, target) {
  const page = await browser.newPage();
  try {
    if (target.signedIn) {
      await signIn(page);
      const cdp = await page.createCDPSession();
      await cdp.send('Network.clearBrowserCache');
    }
    const result = await lighthouse(
      `${BASE_URL}${target.path}`,
      {
        output: 'html',
        logLevel: 'error',
        onlyCategories: CATEGORIES,
        disableStorageReset: target.signedIn,
      },
      formFactor.config,
      page,
    );
    const { lhr } = result;
    return {
      page: target.path,
      formFactor: formFactor.name,
      finalUrl: lhr.finalDisplayedUrl,
      scores: Object.fromEntries(
        CATEGORIES.map((c) => [c, Math.round(lhr.categories[c].score * 100)]),
      ),
      metrics: Object.fromEntries(
        Object.entries(METRICS).map(([id, label]) => [label, lhr.audits[id].displayValue]),
      ),
      html: result.report,
    };
  } finally {
    await page.close();
  }
}

/** Runs one page RUNS times; keeps the run with the median performance score. */
async function auditMedian(browser, formFactor, target) {
  const runs = [];
  for (let i = 0; i < RUNS; i += 1) runs.push(await audit(browser, formFactor, target));
  const sorted = [...runs].sort((a, b) => a.scores.performance - b.scores.performance);
  const { html, ...median } = sorted[Math.floor(sorted.length / 2)];
  const report = `${OUT_DIR}/${formFactor.name}-${target.name}.html`;
  writeFileSync(report, html);
  return { ...median, report, allPerformanceScores: runs.map((r) => r.scores.performance) };
}

function summaryHtml(runs, measuredAt) {
  const rows = runs
    .map(
      (r) =>
        `<tr><td>${r.page}</td><td>${r.formFactor}</td>${CATEGORIES.map((c) => `<td class="${r.scores[c] >= 90 ? 'good' : 'bad'}">${r.scores[c]}</td>`).join('')}${Object.values(
          r.metrics,
        )
          .map((m) => `<td>${m}</td>`)
          .join('')}</tr>`,
    )
    .join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>AdminFlow – Lighthouse summary</title>
<style>body{font:14px system-ui,sans-serif;margin:32px;color:#0f172a}table{border-collapse:collapse;width:100%}th,td{border:1px solid #cbd5e1;padding:6px 8px;text-align:left}th{background:#f1f5f9}.good{color:#166534;font-weight:600}.bad{color:#b91c1c;font-weight:600}p{color:#334155}</style></head>
<body><h1>AdminFlow – Lighthouse report</h1>
<p>Production build (<code>vite build</code> + <code>vite preview</code>), Lighthouse ${LIGHTHOUSE_VERSION}, measured ${measuredAt}. Each row is the median of ${RUNS} runs (all performance scores in summary.json).</p>
<p><b>Mobile</b> = Lighthouse default (simulated slow 4G, 4× CPU slowdown). <b>Desktop</b> = Lighthouse desktop config.
<code>/login</code> is a first visit (storage and cache cleared). <code>/dashboard</code> and <code>/users</code> are measured
signed in, with the HTTP cache cleared, so all code is downloaded again.</p>
<table><thead><tr><th>Page</th><th>Device</th>${CATEGORIES.map((c) => `<th>${c}</th>`).join('')}${Object.values(
    METRICS,
  )
    .map((m) => `<th>${m}</th>`)
    .join('')}</tr></thead><tbody>${rows}</tbody></table>
<p>The full report for each run follows.</p></body></html>`;
}

async function buildPdf(browser, runs, measuredAt) {
  const page = await browser.newPage();
  const merged = await PDFDocument.create();
  const append = async (bytes) => {
    const doc = await PDFDocument.load(bytes);
    for (const p of await merged.copyPages(doc, doc.getPageIndices())) merged.addPage(p);
  };
  await page.setContent(summaryHtml(runs, measuredAt));
  await append(await page.pdf({ format: 'A4', printBackground: true }));
  for (const run of runs) {
    await page.goto(pathToFileURL(resolve(run.report)).href, { waitUntil: 'networkidle0' });
    await append(await page.pdf({ format: 'A4', printBackground: true }));
  }
  await page.close();
  writeFileSync(`${OUT_DIR}/lighthouse-report.pdf`, await merged.save());
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const server = await startPreview();
  const browser = await launchBrowser();
  try {
    const runs = [];
    for (const formFactor of FORM_FACTORS) {
      for (const target of PAGES) {
        if (ONLY && ONLY !== `${formFactor.name}-${target.name}`) continue;
        const run = await auditMedian(browser, formFactor, target);
        runs.push(run);
        console.log(
          `${formFactor.name.padEnd(7)} ${target.path.padEnd(11)} ` +
            CATEGORIES.map((c) => `${c} ${run.scores[c]}`).join('  ') +
            `   LCP ${run.metrics.LCP}  TBT ${run.metrics.TBT}  CLS ${run.metrics.CLS}` +
            `   (performance in ${RUNS} runs: ${run.allPerformanceScores.join(', ')})`,
        );
      }
    }
    const measuredAt = new Date().toISOString();
    writeFileSync(
      `${OUT_DIR}/summary.json`,
      `${JSON.stringify({ measuredAt, lighthouse: LIGHTHOUSE_VERSION, runsPerPage: RUNS, runs }, null, 2)}\n`,
    );
    await buildPdf(browser, runs, measuredAt);
    console.log(`\nWrote ${OUT_DIR}/summary.json and ${OUT_DIR}/lighthouse-report.pdf`);
  } finally {
    await browser.close();
    stopPreview(server);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
