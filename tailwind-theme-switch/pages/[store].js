import Head from 'next/head';
import {fetchStore, toCssText} from '../lib/tokens.server';

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
      css: toCssText(store),
    },
  };
}

export default function StorePage({name, tagline, products, css}) {
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
              <span className="text-sm text-muted">{products.length} items</span>
            </div>

            <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map(p => (
                <li key={p.name} className="group">
                  <a
                    href="#"
                    className="flex h-full flex-col rounded-card border border-muted/15 bg-card p-5 transition duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-medium group-hover:text-brand">
                        {p.name}
                      </h3>
                      {p.badge != null && (
                        <span className="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand">
                          {p.badge}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted">{p.note}</p>
                    <p className="mt-4 font-semibold tabular-nums">{p.price}</p>
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-14 rounded-card border border-muted/15 bg-card p-6">
            <h2 className="font-semibold">What is store-controlled, and what is not</h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-medium">From the API, per store</dt>
                <dd className="mt-1 text-muted">
                  Brand palette, surface and ink, card radius — light and dark.
                  Seven variables.
                </dd>
              </div>
              <div>
                <dt className="font-medium">Shared, in the build</dt>
                <dd className="mt-1 text-muted">
                  Spacing and type scales, breakpoints, shadows, transitions,
                  every layout decision on this page.
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
