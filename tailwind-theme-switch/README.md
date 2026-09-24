# tailwind-theme-switch

Per-store theming where **the build never learns that the stores exist**.

The browser gets one stylesheet, shared by every store. The server resolves the
store for the request and inlines that one store's token values. No theme
JavaScript, no list of stores, no client-side switching.

```sh
npm install
npm run build
npm run verify     # checks the two properties below
npm start          # then open /acme-coffee, /beta-books
```

## How it works

**The contract lives in CSS, with one set of defaults.** `styles/globals.css`
declares names and fallback values, and nothing else:

```css
@theme {
  --color-brand: #64748b;
  --radius-card: 0.5rem;
}
```

Because this is `@theme` and not `@theme inline`, utilities compile to a
reference rather than a value:

```css
.bg-brand { background-color: var(--color-brand); }
```

> Using the `inline` option, the utility class will use the theme variable
> _value_ instead of referencing the actual theme variable
> — [Tailwind docs](https://tailwindcss.com/docs/theme)

So `inline` would break this. It is the one Tailwind setting that matters here.

**The values arrive per request.** `getServerSideProps` in `pages/[store].js`
resolves the slug, asks `lib/tokens.server.js` (standing in for the API), and
renders a single tag into `<head>`:

```html
<style id="store-theme">:root{--color-brand:#7c3aed;--radius-card:1rem}</style>
```

That is the entire theme switch. Every utility on the page follows, because they
all resolve through `var()`.

## Does it need SSR?

Yes, and that is the point rather than a cost.

The values have to be in the **first response**. Fetching them client-side would
paint the default theme first and repaint — a flash of the wrong brand on the
page a visitor arrived at from a link. Inlining them server-side means the first
paint is already branded, with no round trip.

It also means the shared stylesheet stays identical for every store, so it
caches once across all of them. The only per-store bytes are ~200 in the HTML,
which is per-store anyway.

## What `npm run verify` checks

1. **The build is store-agnostic.** No slug, store name or store colour appears
   in any file under `.next/static`.
2. **A response carries exactly one store.** Each storefront returns its own
   values and no trace of another — including `unreleased-secret`, which exists
   to make an accidental leak visible.

The first run of this example **failed**, because `pages/index.js` used two real
slugs as example links in its copy. Two words in prose put both store names into
a JavaScript chunk. That is how quietly the property goes away, and why the
check is worth having in CI rather than in a review checklist.

## Why not a package per store

A `design-system-acme` package would be a build-time artifact, so it lands in
the bundle. Code-splitting it does not fix this: webpack's docs are explicit
that a dynamic expression pulls in everything that could match —

> when you are using a dynamic expression — every module that could potentially
> be requested on an `import()` call is included
> — [webpack docs](https://webpack.js.org/api/module-methods/)

The chunks stay separate, so a visitor downloads only their store's code, but
the **map of store names ships in the main bundle**. An explicit
`{acme: () => import(...)}` map has the same problem. Anything resolved at build
time tells the client which stores exist.

So the ladder is:

| | | leaks the store list |
|---|---|---|
| 1 | add tokens — values from the API | no |
| 2 | a variant on a shared component | no |
| 3 | a store-specific component, dynamically imported | **yes** |

1 and 2 keep the property. 3 spends it, and should be rare enough to be a
decision rather than a habit.

## Files

```
styles/globals.css      the contract: names + defaults. Knows no store.
lib/tokens.server.js    the fake API. Server-only; never bundled.
pages/[store].js        resolves the store, inlines its values.
pages/index.js          unbranded. Names no store, on purpose.
scripts/verify.mjs      the two checks.
```
