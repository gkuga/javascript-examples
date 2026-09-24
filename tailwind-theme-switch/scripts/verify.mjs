// Checks the two properties the example exists to demonstrate.
//
//   1. The build is store-agnostic. No slug, store name or store-specific token
//      value appears in any asset served to the browser.
//   2. A response carries exactly one store. Visiting one storefront returns
//      that store's values and no trace of any other.
//
// Run `npm run build` first; this starts the production server itself.

import {spawn} from 'node:child_process';
import {readdir, readFile} from 'node:fs/promises';
import {join} from 'node:path';

const SLUGS = ['acme-coffee', 'beta-books', 'unreleased-secret'];
const NAMES = ['Acme Coffee', 'Beta Books', 'Unreleased Secret'];
// Each store's light brand value, verbatim from lib/tokens.server.js.
const BRAND = {
  'acme-coffee': 'oklch(0.55 0.21 295)',
  'beta-books': 'oklch(0.52 0.10 185)',
  'unreleased-secret': 'oklch(0.52 0.20 25)',
};

const PORT = 3789;
let failures = 0;

function ok(msg) {
  console.log(`  \u001b[32mPASS\u001b[0m ${msg}`);
}

function bad(msg) {
  failures++;
  console.log(`  \u001b[31mFAIL\u001b[0m ${msg}`);
}

async function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, {withFileTypes: true});
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

console.log('\n1. the build never learned the stores\n');

const assets = (await walk('.next/static')).filter(f => /\.(js|css)$/.test(f));

if (assets.length === 0) {
  bad('no built assets found under .next/static — run `npm run build` first');
} else {
  ok(`${assets.length} built asset(s) to search`);

  const needles = [...SLUGS, ...NAMES, ...Object.values(BRAND)];
  const found = [];

  for (const file of assets) {
    const text = await readFile(file, 'utf8');
    for (const needle of needles) {
      if (text.includes(needle)) found.push(`${needle} in ${file}`);
    }
  }

  if (found.length === 0) {
    ok('no slug, store name or store colour appears in any shipped asset');
  } else {
    for (const f of found) bad(f);
  }
}

console.log('\n2. a response carries exactly one store\n');

const server = spawn('npx', ['next', 'start', '-p', String(PORT)], {
  stdio: 'ignore',
});

process.on('exit', () => server.kill());

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/`);
      if (r.ok) return true;
    } catch {
      /* not up yet */
    }
    await new Promise(r => setTimeout(r, 500));
  }
  return false;
}

if (!(await waitForServer())) {
  bad(`server did not come up on :${PORT}`);
} else {
  for (const slug of SLUGS) {
    const html = await (await fetch(`http://127.0.0.1:${PORT}/${slug}`)).text();

    if (html.includes(BRAND[slug])) ok(`/${slug} carries its own brand colour`);
    else bad(`/${slug} is missing its brand colour ${BRAND[slug]}`);

    const others = SLUGS.filter(s => s !== slug);
    const leaked = others.filter(
      s => html.includes(BRAND[s]) || html.includes(s)
    );

    if (leaked.length === 0) ok(`/${slug} mentions no other store`);
    else bad(`/${slug} leaked: ${leaked.join(', ')}`);
  }

  const home = await (await fetch(`http://127.0.0.1:${PORT}/`)).text();
  const onHome = SLUGS.filter(s => home.includes(s));
  if (onHome.length === 0) ok('the unbranded page names no store');
  else bad(`the unbranded page named: ${onHome.join(', ')}`);

  console.log('\n3. the override actually wins the cascade\n');

  // The injected <style> lands in <head> *before* the stylesheet link, so on
  // source order alone Tailwind's defaults would overwrite the store's values.
  // They do not, because @theme compiles into `@layer theme` and unlayered
  // declarations outrank layered ones whatever the order. Both halves of that
  // are asserted here: lose either and the page silently renders the default
  // brand while every other check still passes.
  const themeCss = assets.find(f => f.endsWith('.css'));

  if (themeCss === undefined) {
    bad('no stylesheet found to inspect');
  } else {
    const text = await readFile(themeCss, 'utf8');
    const at = text.indexOf('--color-brand:');
    const openers = [...text.slice(0, at).matchAll(/@layer [a-z, ]+\{/g)];
    const last = openers.at(-1)?.[0];

    if (last === '@layer theme{') {
      ok('Tailwind emits the theme variables inside @layer theme');
    } else {
      bad(`theme variables are not in @layer theme (found: ${last ?? 'no layer'})`);
    }

    const page = await (await fetch(`http://127.0.0.1:${PORT}/${SLUGS[0]}`)).text();
    const tag = page.match(/<style id="store-theme"[^>]*>([\s\S]*?)<\/style>/);

    if (tag === null) bad('no injected <style id="store-theme"> in the response');
    else if (tag[1].includes('@layer')) bad('the injected override is layered, so it would lose');
    else ok('the injected override is unlayered, so it outranks @layer theme');
  }
}

server.kill();

console.log(
  failures === 0
    ? '\n\u001b[32mall checks passed\u001b[0m\n'
    : `\n\u001b[31m${failures} check(s) failed\u001b[0m\n`
);

process.exit(failures === 0 ? 0 : 1);
