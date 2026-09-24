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

## What Tailwind is actually for here

The theming is the small part. Seven variables change per store; everything else
on the page — the responsive grid, the spacing rhythm, the hover and focus
states, the transitions — is shared, and that is the part Tailwind carries.

Three things it does that plain CSS variables do not:

**Opacity modifiers follow the runtime value.** `bg-brand/10` does not need a
second variable:

```css
.bg-brand\/10{background-color:#6b727e1a}
@supports (color:color-mix(in lab, red, red)){
  .bg-brand\/10{background-color:color-mix(in oklab, var(--color-brand) 10%, transparent)}
}
```

The `color-mix()` form references the variable, so a tint of the brand tracks
whatever the server injected. The literal above it is the fallback for browsers
without `color-mix`, and it carries the *default* brand — worth knowing, though
every current browser takes the second rule.

**Variants compose over themed values.** `hover:bg-brand/90`,
`focus-visible:ring-brand/40`, `group-hover:text-brand`, `sm:grid-cols-2
lg:grid-cols-3`, `dark:` — all of it resolves through the same variables, and
none of it is code you maintain.

**The scale is not the store's to change.** Spacing, type, breakpoints and
shadows stay in the build at Tailwind's defaults. A store gets brand, surface,
ink and a radius. It can look unmistakably like itself and still cannot break
the layout, because the scales were never handed over.

## Why the override wins

The injected `<style>` lands in `<head>` *before* the stylesheet link, so on
source order alone Tailwind's defaults would overwrite it. They do not:
`@theme` compiles into `@layer theme`, and **unlayered declarations outrank
layered ones regardless of order.** The injected block is unlayered, so it wins
wherever it sits.

That is structural rather than lucky, which is why `verify.mjs` asserts both
halves. Lose either and the page renders the default brand while every other
check still passes.

## When a store wants a different page, not a different colour

Name the variant for **what it is**, never for **whose it is**.

`components/layouts.js` ships three: `grid`, `editorial`, `gallery`. The API
says which one a store uses. The build learns that three layouts exist; it
learns nothing about any store, and the thousandth store needs no deploy.

```js
// lib/tokens.server.js — data, server-side
{ name: 'Beta Books', layout: 'editorial', light: {...} }

// pages/[store].js — a closed set, no store identity
const Catalogue = layoutFor(layout);
```

Yes, every layout is in the bundle. That is the trade, and it is a good one:
the names are `grid` and `gallery`, which give nothing away. Compare the
alternative — `import(`./stores/${slug}`)` — where the chunks split per store
but the *map of store names* ships to everyone.

How far this goes:

| what differs | how | leaks the store list |
|---|---|---|
| colour, radius, font | tokens from the API | no |
| a component's treatment | a variant prop | no |
| the whole page structure | a layout name from the API | no |
| bespoke interactive features | its own deployment, consuming the shared package | no |
| bespoke code inside this app | `import()` per store | **yes** |

The fourth row is the honest answer for a store that needs genuinely custom
behaviour — a booking flow nobody else has. Give it its own deployment. That
build knows exactly one store because it *is* that store, so nothing leaks, and
the shared storefront stays store-agnostic. It costs infrastructure, which is
the right thing to spend when a store has genuinely left the shared product.

The last row is the one to avoid. It is the only option here that tells every
visitor which stores exist.

## What `npm run verify` checks

1. **The build is store-agnostic.** No slug, store name or store colour appears
   in any file under `.next/static`.
2. **A response carries exactly one store.** Each storefront returns its own
   values and no trace of another — including `unreleased-secret`, which exists
   to make an accidental leak visible.
3. **Layouts ship, stores do not.** All three layouts are in the bundle, each
   storefront renders exactly the one it asked for, and no store name is
   anywhere near the build.
4. **The override wins the cascade.** Tailwind's theme is inside `@layer theme`
   and the injected block is not, which is what makes the order in `<head>`
   irrelevant.

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
lib/tokens.server.js    the fake API: tokens, catalogue, layout name.
components/layouts.js   three layouts, named for what they are.
pages/[store].js        resolves the store, inlines its values, picks a layout.
pages/index.js          unbranded. Names no store, on purpose.
scripts/verify.mjs      the two checks.
```
