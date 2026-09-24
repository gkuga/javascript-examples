import Head from 'next/head';
import {fetchStore, toCssText} from '../lib/tokens.server';

// The server resolves the store from the path and hands back that store's token
// values. `fetchStore` is reachable only from here, so it never reaches the
// client bundle.
export async function getServerSideProps({params}) {
  const store = await fetchStore(params.store);

  if (store === null) {
    return {notFound: true};
  }

  return {props: {name: store.name, css: toCssText(store.tokens)}};
}

export default function StorePage({name, css}) {
  return (
    <>
      <Head>
        <title>{name}</title>
        {/* The whole theme switch. One store's values, inlined in the first
            response, so the page paints branded with no round trip and no
            flash of the default. */}
        <style id="store-theme">{css}</style>
      </Head>

      <main className="min-h-screen bg-surface px-6 py-16 font-display text-ink">
        <div className="mx-auto max-w-xl">
          <p className="text-sm text-muted">Storefront</p>
          <h1 className="mt-1 text-3xl font-semibold">{name}</h1>

          <div className="mt-8 rounded-card bg-brand p-6 text-brand-ink">
            <h2 className="text-lg font-semibold">Every utility moved</h2>
            <p className="mt-2 text-sm opacity-90">
              Nothing on this page names a store. These are the same classes the
              other storefronts use — <code>bg-brand</code>,{' '}
              <code>rounded-card</code>, <code>text-ink</code> — resolving
              against variables the server set a moment ago.
            </p>
          </div>

          <div className="mt-4 rounded-card border border-muted/30 bg-white/60 p-6">
            <h2 className="text-lg font-semibold">What shipped to get here</h2>
            <ul className="mt-2 space-y-1 text-sm text-muted">
              <li>One CSS file, shared by every store, cacheable across all of them.</li>
              <li>One <code>&lt;style&gt;</code> tag, this store only.</li>
              <li>No theme JavaScript, and no list of stores.</li>
            </ul>
          </div>

          <p className="mt-8 text-sm text-muted">
            Change the slug in the URL to see another one. Run{' '}
            <code>npm run verify</code> to check the build never learned their
            names.
          </p>
        </div>
      </main>
    </>
  );
}
