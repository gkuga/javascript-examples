import Head from 'next/head';
import {fetchStore, toCssText} from '../lib/tokens.server';
import {layoutFor} from '../components/layouts';

export async function getServerSideProps({params}) {
  const store = await fetchStore(params.store);

  if (store === null) {
    return {notFound: true};
  }

  return {
    props: {
      name: store.name,
      tagline: store.tagline,
      products: store.products,
      layout: store.layout,
      css: toCssText(store),
    },
  };
}

export default function StorePage({name, tagline, products, layout, css}) {
  // Picked by name, from a closed set. Nothing here knows which store asked.
  const Catalogue = layoutFor(layout);

  return (
    <>
      <Head>
        <title>{name}</title>
        {/* The whole theme switch: one store's values, light and dark, inlined
            in the first response. Everything below is store-agnostic markup. */}
        <style id="store-theme">{css}</style>
      </Head>

      <div className="min-h-screen bg-surface font-display text-ink antialiased">
        <header className="sticky top-0 z-10 border-b border-muted/15 bg-surface/80 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <span className="text-sm font-semibold tracking-tight">{name}</span>
            <nav className="flex items-center gap-1">
              {['Shop', 'About'].map(label => (
                <a
                  key={label}
                  href="#"
                  className="rounded-md px-3 py-1.5 text-sm text-muted transition-colors hover:bg-brand/10 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
                >
                  {label}
                </a>
              ))}
              <a
                href="#"
                className="ml-2 rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-brand-ink transition hover:opacity-90 active:scale-95 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
              >
                Cart
              </a>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-6 pb-24">
          <section className="grid gap-8 py-14 md:grid-cols-[1.2fr_1fr] md:items-center">
            <div>
              <p className="inline-flex rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
                Storefront
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                {tagline}
              </h1>
              <p className="mt-4 max-w-prose text-muted">
                Every class on this page is shared with every other storefront.
                Only the custom properties differ, and they arrived with the
                HTML.
              </p>
            </div>
            <div className="rounded-card bg-brand p-8 text-brand-ink shadow-lg shadow-brand/20">
              <p className="text-sm/6 opacity-90">
                <code>bg-brand</code>, <code>shadow-brand/20</code> and{' '}
                <code>rounded-card</code> all resolve through variables the
                server set — including the opacity, via{' '}
                <code>color-mix()</code>.
              </p>
            </div>
          </section>

          <section>
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-semibold">Catalogue</h2>
              <span className="text-sm text-muted">
                {products.length} items · {layout}
              </span>
            </div>

            <Catalogue products={products} />
          </section>

          <section className="mt-14 rounded-card border border-muted/15 bg-card p-6">
            <h2 className="font-semibold">What is store-controlled, and what is not</h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-medium">From the API, per store</dt>
                <dd className="mt-1 text-muted">
                  Brand palette, surface and ink, card radius — light and dark.
                  And which layout to use, by name.
                </dd>
              </div>
              <div>
                <dt className="font-medium">Shared, in the build</dt>
                <dd className="mt-1 text-muted">
                  The spacing and type scales, and all three layouts. The
                  build ships every layout and knows no store.
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-sm text-muted">
              A store can look unmistakably like itself without being able to
              break the layout, because the scales were never theirs to set.
            </p>
          </section>
        </main>
      </div>
    </>
  );
}
