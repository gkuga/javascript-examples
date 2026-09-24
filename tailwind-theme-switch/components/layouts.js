// Layouts are named for what they are, never for whose they are.
//
// The build learns that three layouts exist. It does not learn that any store
// exists, nor which store uses which — that mapping lives server-side, next to
// the tokens. Adding the thousandth store adds nothing here and needs no deploy.
//
// This is the answer to "this store wants a completely different look". It is
// a different look, chosen per request, with no store identity in the bundle.

function Price({children}) {
  return <p className="mt-1 font-semibold tabular-nums">{children}</p>;
}

function Badge({children}) {
  return (
    <span className="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand">
      {children}
    </span>
  );
}

// Compact cards. Reads as a shop.
function GridLayout({products}) {
  return (
    <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map(p => (
        <li key={p.name} className="group">
          <a
            href="#"
            className="flex h-full flex-col rounded-card border border-muted/15 bg-card p-5 transition duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-medium group-hover:text-brand">{p.name}</h3>
              {p.badge != null && <Badge>{p.badge}</Badge>}
            </div>
            <p className="mt-1 text-sm text-muted">{p.note}</p>
            <Price>{p.price}</Price>
          </a>
        </li>
      ))}
    </ul>
  );
}

// One column, numbered, generous. Reads as a catalogue or a reading list.
function EditorialLayout({products}) {
  return (
    <ol className="mt-5 divide-y divide-muted/15 border-y border-muted/15">
      {products.map((p, i) => (
        <li key={p.name} className="group">
          <a
            href="#"
            className="flex items-baseline gap-5 py-5 transition-colors hover:bg-brand/5 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none sm:gap-8"
          >
            <span className="w-8 shrink-0 text-right font-mono text-sm text-muted tabular-nums">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="text-lg group-hover:text-brand">{p.name}</h3>
                {p.badge != null && <Badge>{p.badge}</Badge>}
              </div>
              <p className="mt-1 text-sm text-muted">{p.note}</p>
            </div>
            <Price>{p.price}</Price>
          </a>
        </li>
      ))}
    </ol>
  );
}

// Image-forward, two up, tall. Reads as a lookbook.
function GalleryLayout({products}) {
  return (
    <ul className="mt-5 grid gap-6 sm:grid-cols-2">
      {products.map(p => (
        <li key={p.name} className="group">
          <a
            href="#"
            className="block focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
          >
            <div className="aspect-4/3 rounded-card bg-brand/10 transition-colors group-hover:bg-brand/20" />
            <div className="mt-3 flex items-baseline justify-between gap-3">
              <h3 className="font-medium group-hover:text-brand">{p.name}</h3>
              {p.badge != null && <Badge>{p.badge}</Badge>}
            </div>
            <p className="mt-1 text-sm text-muted">{p.note}</p>
            <Price>{p.price}</Price>
          </a>
        </li>
      ))}
    </ul>
  );
}

// A closed set. An unknown name falls back rather than failing, because the
// server could name a layout this build has not shipped yet.
const LAYOUTS = {
  grid: GridLayout,
  editorial: EditorialLayout,
  gallery: GalleryLayout,
};

export const LAYOUT_NAMES = Object.keys(LAYOUTS);

export function layoutFor(name) {
  return LAYOUTS[name] ?? GridLayout;
}
