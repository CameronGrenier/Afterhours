/**
 * Shared instruction building blocks
 *
 * The generic, game-agnostic pieces every paged manual is assembled from
 * (Crash Out, Slang!, and any future game). Import what you need:
 *
 *   import { Page, PageHeader, Heading, Lead, StepRow,
 *            OutlineBlock, FillBlock, LedgerRow } from "@/instructions/shared";
 *
 * Game-specific elements (e.g. Crash Out's MultiplierTrack, Slang's WordChain)
 * stay local to their own manual; only the truly shared frame lives here.
 *
 * ------------------------------------------------------------------ *
 * DESIGN SYSTEM (keep this consistent when adding pages)
 *
 *   Reference points: Uber and Cards Against Humanity. Flat, high contrast,
 *   type does the work. No gradients, no glows, no shadows, no accent hues.
 *
 *   Ink:      white and black only. Greys are white at reduced opacity
 *             (/85 /70 /60 /50 /40 /15) used purely for hierarchy.
 *   Type:     font-display (the app's brand face, same as the wordmark),
 *             uppercase, for every heading and every number. Body text is the
 *             app's inherited base font. No fonts are imported here on purpose;
 *             set faces in your Tailwind theme if you want stricter control.
 *   Radius:   sharp (rounded-none) for data/content blocks. 8px (rounded-lg)
 *             only on the small kicker tag. That is the whole radius story.
 *   Emphasis: INVERSION. A solid white block (bg-white text-black) is the one
 *             focal element on a page. Use it once per page so it stays loud.
 *
 * NOTES FOR THE NEXT DEV
 *   - Pages are plain elements selected by index (never .map()'d), so they
 *     need no key prop, matching how <Instructions /> consumes them.
 *   - Sizing is fluid: clamp() type, grids that collapse to one column. The
 *     same JSX renders in the desktop parallelogram and the mobile fullscreen
 *     dialog, so nothing assumes a width.
 *   - <Page> vertically centres its block and keeps top/bottom padding so the
 *     dialog's floating title and OK button never sit on the copy.
 *   - The page total in <PageHeader /> is passed in per manual via the `total`
 *     prop, so each game owns its own count.
 * ------------------------------------------------------------------ *
 */

/**
 * Page
 *
 * The frame every instruction page sits in. Vertically centres its block and
 * keeps generous top/bottom padding so the dialog's floating title and OK
 * button never overlap the copy. Content is left aligned on purpose to avoid
 * the centred-hero look; the block as a whole is what gets centred.
 * overflow-y-auto is a safety net for very short viewports.
 */
export function Page({ children }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center overflow-y-auto px-6 py-12 text-white sm:px-10 xl:px-16 xl:py-20">
      <div className="flex w-full max-w-4xl flex-col gap-6 sm:gap-8">
        {children}
      </div>
    </div>
  );
}

/**
 * PageHeader
 *
 * Rulebook-style top row: a bordered section tag on the left, a progress
 * counter on the right. The counter earns its place because the modal has no
 * other progress indicator, so it tells the reader how far through they are.
 *
 * @param {string} kicker  Section label.
 * @param {string} index   This page's number, e.g. "03".
 * @param {string} total   The manual's page total, e.g. "08".
 */
export function PageHeader({ kicker, index, total }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="rounded-lg border-2 border-white px-3 py-1 text-[0.7rem] font-bold uppercase tracking-[0.25em] sm:text-xs">
        {kicker}
      </span>
      <span className="font-display text-sm tabular-nums tracking-widest text-white/50 sm:text-base">
        {index} / {total}
      </span>
    </div>
  );
}

/**
 * Heading
 *
 * The page's display line. Brand face, uppercase, very tight leading.
 */
export function Heading({ children }) {
  return (
    <h3 className="font-display text-[clamp(2rem,5.5vw,4rem)] uppercase leading-[0.95] tracking-tight">
      {children}
    </h3>
  );
}

/**
 * Lead
 *
 * Secondary explanatory paragraph. Constrained width for readability on the
 * very wide desktop panel.
 */
export function Lead({ children }) {
  return (
    <p className="max-w-xl text-[clamp(0.95rem,1.6vw,1.25rem)] leading-snug text-white/60">
      {children}
    </p>
  );
}

/**
 * StepRow
 *
 * An ordered step: oversized index numeral on the left, text on the right,
 * separated from the next row by a rule. Numbering is legitimate here because
 * the steps genuinely are a sequence.
 *
 * @param {string} n                  Step number, e.g. "01".
 * @param {string} title              Step title.
 * @param {React.ReactNode} children  Step description.
 * @param {boolean} [last]            Drops the bottom rule on the final row.
 */
export function StepRow({ n, title, children, last }) {
  return (
    <div
      className={
        "flex items-start gap-4 py-4 sm:gap-6 sm:py-5 " +
        (last ? "" : "border-b-2 border-white/15")
      }
    >
      <span className="font-display text-[clamp(1.75rem,4vw,3rem)] leading-none tabular-nums text-white/40">
        {n}
      </span>
      <div className="min-w-0">
        <p className="text-lg font-bold uppercase tracking-tight sm:text-2xl">
          {title}
        </p>
        <p className="mt-1 text-sm leading-snug text-white/60 sm:text-base">
          {children}
        </p>
      </div>
    </div>
  );
}

/**
 * OutlineBlock
 *
 * A hollow, outlined card for supporting (non-focal) facts.
 *
 * @param {string} label              Small uppercase label.
 * @param {React.ReactNode} children  Body text.
 */
export function OutlineBlock({ label, children }) {
  return (
    <div className="flex h-full flex-col border-2 border-white p-4 sm:p-5">
      <p className="text-[0.7rem] font-bold uppercase tracking-[0.25em] text-white/50">
        {label}
      </p>
      <p className="mt-2 text-sm leading-snug text-white/80 sm:text-base">
        {children}
      </p>
    </div>
  );
}

/**
 * FillBlock
 *
 * The inverted (solid white) card. This is the focal element on its page, so
 * use it for the single most important thing.
 *
 * @param {string} label              Small uppercase label.
 * @param {React.ReactNode} children  Body content (already styled for black).
 */
export function FillBlock({ label, children }) {
  return (
    <div className="flex h-full flex-col bg-white p-4 !text-black sm:p-5">
      <p className="text-[0.7rem] font-bold uppercase tracking-[0.25em] !text-black/60">
        {label}
      </p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

/**
 * LedgerRow
 *
 * A quiet reference row: top rule, small term, plain description. Used on the
 * pages that intentionally carry no inversion.
 *
 * @param {string} term               Short label for the rule.
 * @param {React.ReactNode} children  Description.
 */
export function LedgerRow({ term, children }) {
  return (
    <div className="border-t-2 border-white/15 py-4">
      <p className="text-[0.7rem] font-bold uppercase tracking-[0.25em] text-white/50">
        {term}
      </p>
      <p className="mt-1.5 text-sm leading-snug text-white/85 sm:text-base">
        {children}
      </p>
    </div>
  );
}
