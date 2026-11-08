// Builds the 5 Month 4 deliverables in submission/, named [participant]-month4-[deliverable].
//
//   npm run submission     (builds Storybook first; commit everything before running)
//
// The app zip comes from `git archive HEAD`: exactly the committed files, so node_modules, .env,
// dist and other ignored files can never end up in it (and .gitattributes keeps submission/ out).
// That is also why the script refuses to run with uncommitted changes.
import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join, relative, sep } from 'node:path';
import { zipSync } from 'fflate';

const PARTICIPANT = 'subhash-jeewantha';
const OUT_DIR = 'submission';
const out = (deliverable) => join(OUT_DIR, `${PARTICIPANT}-month4-${deliverable}`);
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();

/** Every file under `dir`, as { 'relative/path': bytes } for fflate. */
function readTree(dir) {
  const files = {};
  const walk = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else files[relative(dir, full).split(sep).join('/')] = readFileSync(full);
    }
  };
  walk(dir);
  return files;
}

function main() {
  // submission/ itself is the output, so changes there do not count.
  if (git('status', '--porcelain', '--', '.', ':(exclude)submission')) {
    throw new Error('Uncommitted changes: commit first, so the submission matches the repository.');
  }
  for (const file of ['storybook-static/index.html', 'docs/lighthouse/lighthouse-report.pdf']) {
    if (!existsSync(file))
      throw new Error(`Missing ${file} – run npm run build-storybook / npm run lighthouse.`);
  }
  const commit = git('rev-parse', '--short', 'HEAD');
  mkdirSync(OUT_DIR, { recursive: true });

  git('archive', '--format=zip', '--prefix=adminflow-dashboard/', '-o', out('app.zip'), 'HEAD');
  writeFileSync(out('storybook.zip'), zipSync(readTree('storybook-static'), { level: 9 }));
  copyFileSync('docs/lighthouse/lighthouse-report.pdf', out('lighthouse.pdf'));
  copyFileSync('docs/accessibility.md', out('accessibility.md'));
  copyFileSync('docs/architecture.md', out('architecture.md'));

  console.log(`Built from commit ${commit}:`);
  for (const file of readdirSync(OUT_DIR).sort()) {
    console.log(
      `  ${OUT_DIR}/${file}  (${Math.ceil(statSync(join(OUT_DIR, file)).size / 1024)} KB)`,
    );
  }
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
