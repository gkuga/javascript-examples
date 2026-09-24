import Head from 'next/head';

// This page deliberately names no store, not even as an example. A directory of
// storefronts is a server-rendered, authorised page — never something the build
// knows. The first run of `npm run verify` failed because two slugs were
// written into the copy here, which is exactly how the property gets lost.
export default function Home() {
  return (
    <>
      <Head>
        <title>tailwind-theme-switch</title>
      </Head>
      <main className="min-h-screen bg-surface px-6 py-16 font-display text-ink">
        <div className="mx-auto max-w-xl">
          <h1 className="text-3xl font-semibold">tailwind-theme-switch</h1>
          <p className="mt-2 text-muted">
            No store was resolved for this request, so the defaults from{' '}
            <code>@theme</code> apply. Everything below is unbranded.
          </p>

          <div className="mt-8 rounded-card bg-brand p-6 text-brand-ink">
            <p className="text-sm">
              The same <code>bg-brand</code> that a storefront uses, with nothing
              overriding it.
            </p>
          </div>

          <p className="mt-8 text-sm text-muted">
            Visit any store slug as a path. The slugs live in{' '}
            <code>lib/tokens.server.js</code>, which the browser never receives —
            and which this page must not quote, or the build learns them.
          </p>
        </div>
      </main>
    </>
  );
}
