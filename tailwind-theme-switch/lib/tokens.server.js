// Stands in for the API that owns store branding and catalogue.
//
// This module is imported only from `getServerSideProps`, so Next drops it from
// the client bundle. `scripts/verify.mjs` fails the example if any of these
// slugs reaches a built asset.
//
// A store picks a layout by name — 'grid', 'editorial', 'gallery'. The build
// ships all three; it never learns which store chose what, or that any store
// exists. That mapping is data, and lives here.
//
// Note what a store is allowed to change: brand colours, a radius, a font. It
// cannot touch the spacing or type scale — those stay in `@theme`, shared, so a
// store can be unmistakably itself without being able to break the layout.

const STORES = {
  'acme-coffee': {
    name: 'Acme Coffee',
    tagline: 'Roasted the morning it ships',
    layout: 'gallery',
    light: {
      '--color-brand': 'oklch(0.55 0.21 295)',
      '--color-brand-ink': 'oklch(0.99 0 0)',
      '--color-surface': 'oklch(0.98 0.01 300)',
      '--color-card': 'oklch(1 0 0)',
      '--color-ink': 'oklch(0.25 0.06 300)',
      '--color-muted': 'oklch(0.55 0.04 300)',
      '--radius-card': '1rem',
    },
    dark: {
      '--color-brand': 'oklch(0.72 0.16 295)',
      '--color-brand-ink': 'oklch(0.18 0.04 300)',
      '--color-surface': 'oklch(0.17 0.02 300)',
      '--color-card': 'oklch(0.22 0.03 300)',
      '--color-ink': 'oklch(0.95 0.01 300)',
      '--color-muted': 'oklch(0.70 0.03 300)',
    },
    products: [
      {name: 'Ethiopia Guji', note: 'floral, stone fruit', price: '¥1,880', badge: 'New'},
      {name: 'Kenya Nyeri AA', note: 'blackcurrant, dense', price: '¥2,040'},
      {name: 'House Blend', note: 'cocoa, orange peel', price: '¥1,420', badge: 'Popular'},
      {name: 'Decaf Colombia', note: 'caramel, soft', price: '¥1,560'},
      {name: 'Cold Brew Kit', note: 'makes 1.5L', price: '¥3,200'},
      {name: 'Subscription', note: 'every two weeks', price: '¥1,680', badge: 'Save 12%'},
    ],
  },

  'beta-books': {
    name: 'Beta Books',
    tagline: 'Second-hand, first-rate',
    layout: 'editorial',
    light: {
      '--color-brand': 'oklch(0.52 0.10 185)',
      '--color-brand-ink': 'oklch(0.98 0.01 185)',
      '--color-surface': 'oklch(0.98 0.02 185)',
      '--color-card': 'oklch(1 0 0)',
      '--color-ink': 'oklch(0.24 0.04 190)',
      '--color-muted': 'oklch(0.54 0.03 190)',
      '--radius-card': '0.25rem',
    },
    dark: {
      '--color-brand': 'oklch(0.72 0.11 185)',
      '--color-brand-ink': 'oklch(0.18 0.03 190)',
      '--color-surface': 'oklch(0.16 0.02 190)',
      '--color-card': 'oklch(0.21 0.02 190)',
      '--color-ink': 'oklch(0.95 0.01 190)',
      '--color-muted': 'oklch(0.70 0.02 190)',
    },
    products: [
      {name: 'Borges — Ficciones', note: 'paperback, good', price: '¥900', badge: 'Rare'},
      {name: 'Calvino — Cosmicomics', note: 'hardback, fine', price: '¥1,600'},
      {name: 'Le Guin — The Dispossessed', note: 'paperback, worn', price: '¥700'},
      {name: 'Tanizaki — In Praise of Shadows', note: 'paperback, fine', price: '¥850'},
      {name: 'Perec — Life A User’s Manual', note: 'hardback, good', price: '¥2,400'},
      {name: 'Staff picks box', note: 'five titles, unseen', price: '¥3,000', badge: 'Popular'},
    ],
  },

  // Here to make a leak visible if the example is ever rewritten to resolve
  // stores at build time: a store nobody should be able to discover.
  'unreleased-secret': {
    name: 'Unreleased Secret',
    tagline: 'Not announced yet',
    layout: 'grid',
    light: {
      '--color-brand': 'oklch(0.52 0.20 25)',
      '--color-brand-ink': 'oklch(0.99 0 0)',
      '--color-surface': 'oklch(0.97 0.02 30)',
      '--color-card': 'oklch(1 0 0)',
      '--color-ink': 'oklch(0.25 0.08 30)',
      '--color-muted': 'oklch(0.55 0.05 30)',
      '--radius-card': '9999px',
    },
    dark: {
      '--color-brand': 'oklch(0.70 0.17 25)',
      '--color-brand-ink': 'oklch(0.18 0.05 30)',
      '--color-surface': 'oklch(0.17 0.03 30)',
      '--color-card': 'oklch(0.22 0.04 30)',
      '--color-ink': 'oklch(0.95 0.02 30)',
      '--color-muted': 'oklch(0.70 0.03 30)',
    },
    products: [{name: 'Nothing here yet', note: 'placeholder', price: '—'}],
  },
};

export async function fetchStore(slug) {
  return STORES[slug] ?? null;
}

// One <style> tag's worth. Dark values ride along in the same block, so a store
// gets a dark palette of its own without any JavaScript and without a second
// request.
export function toCssText(store) {
  const decls = t =>
    Object.entries(t)
      .map(([name, value]) => `${name}:${value}`)
      .join(';');

  return [
    `:root{${decls(store.light)}}`,
    `@media (prefers-color-scheme:dark){:root{${decls(store.dark)}}}`,
  ].join('');
}
