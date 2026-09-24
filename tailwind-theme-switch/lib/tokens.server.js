// Stands in for the API that owns store branding.
//
// This module is imported only from `getServerSideProps`, so Next drops it from
// the client bundle. That is the point: the browser never receives this map, and
// `scripts/verify.mjs` fails the example if any of these slugs reaches a built
// asset.
//
// In the real system this is an HTTP call, and the same values are served to the
// Flutter apps — which is why the contract has to be expressible as data rather
// than as a package.

const STORES = {
  'acme-coffee': {
    name: 'Acme Coffee',
    tokens: {
      '--color-brand': '#7c3aed',
      '--color-brand-ink': '#ffffff',
      '--color-surface': '#faf5ff',
      '--color-ink': '#2e1065',
      '--color-muted': '#7e6ba8',
      '--radius-card': '1rem',
    },
  },
  'beta-books': {
    name: 'Beta Books',
    tokens: {
      '--color-brand': '#0f766e',
      '--color-brand-ink': '#ecfeff',
      '--color-surface': '#f0fdfa',
      '--color-ink': '#042f2e',
      '--color-muted': '#4d857f',
      '--radius-card': '0.25rem',
    },
  },
  // Deliberately here to make the leak visible if the example is ever rewritten
  // to resolve stores at build time: a store nobody should be able to discover.
  'unreleased-secret': {
    name: 'Unreleased Secret',
    tokens: {
      '--color-brand': '#b91c1c',
      '--color-brand-ink': '#fef2f2',
      '--color-surface': '#fef2f2',
      '--color-ink': '#450a0a',
      '--color-muted': '#a35d5d',
      '--radius-card': '9999px',
    },
  },
};

export async function fetchStore(slug) {
  return STORES[slug] ?? null;
}

// Serialised into a single <style> tag. Values are the only store-specific
// bytes the browser receives, and it receives exactly one store's worth.
export function toCssText(tokens) {
  const body = Object.entries(tokens)
    .map(([name, value]) => `${name}:${value}`)
    .join(';');

  return `:root{${body}}`;
}
