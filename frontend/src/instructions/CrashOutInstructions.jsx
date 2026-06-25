import { Fragment } from "react";

/**
 * CrashOutInstructions
 *
 * Pages for the Crash Out game, ready to hand straight to <Instructions />:
 *
 *   import Instructions from "@/components/Instructions";
 *   import CrashOutInstructions from "@/instructions/CrashOutInstructions";
 *
 *   const pages = CrashOutInstructions({ startingBalance: 1000, maxBet: 500 });
 *   <Instructions ref={ref} instructions={pages} />
 *
 * The two configurable values from the original copy ("$[set value]" starting
 * balance and "$[value]" max bet) are passed in so the manual always shows the
 * numbers players actually play with.
 *
 * @param {object}  [config]
 * @param {number}  [config.startingBalance=1000]  Balance every player starts with.
 * @param {number}  [config.maxBet=500]            Largest wager allowed per round.
 * @returns {import("react").ReactNode[]} One element per page, in page order.
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
 *             The exception is page 6, where the white-vs-outline pair IS the
 *             content (you keep it all / you lose it all).
 *
 * NOTES FOR THE NEXT DEV
 *   - Pages are plain elements selected by index (never .map()'d), so they
 *     need no key prop, matching how <Instructions /> consumes them.
 *   - Sizing is fluid: clamp() type, grids that collapse to one column. The
 *     same JSX renders in the desktop parallelogram and the mobile fullscreen
 *     dialog, so nothing assumes a width.
 *   - <Page> vertically centres its block and keeps top/bottom padding so the
 *     dialog's floating title and OK button never sit on the copy.
 *   - The "/ 08" in the page header is a hardcoded total. If you add or remove
 *     a page, update TOTAL below.
 * ------------------------------------------------------------------ *
 */

const TOTAL = "08";

export default function CrashOutInstructions({
  startingBalance = 1000,
  maxBet = 500,
} = {}) {
  const money = (n) => `$${n.toLocaleString()}`;

  return [
    /* ---------------------------------------------------------------- *
     * 1 — Objective                                                     *
     * ---------------------------------------------------------------- */
    <Page>
      <PageHeader kicker="How to play" index="01" />

      <Heading>
        Ride it up.
        <br />
        Then get out.
      </Heading>

      <Lead>
        The longer you stay in, the bigger the payout. Wait too long and the
        round crashes, and your bet is gone.
      </Lead>

      <div className="bg-black p-5 border-2 border-white rounded-md sm:p-6">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.3em] sm:text-xs">
          Risk factor
        </p>
        <p className="mt-2 text-lg font-bold leading-tight sm:text-2xl">
          Every round can end instantly. No warning. No way to predict the
          crash.
        </p>
      </div>
    </Page>,

    /* ---------------------------------------------------------------- *
     * 2 — Getting started                                              *
     * ---------------------------------------------------------------- */
    <Page>
      <PageHeader kicker="Getting started" index="02" />

      <Heading>Join the table</Heading>

      <div className="flex flex-col">
        <StepRow n="01" title="Enter the lobby">
          Join the lobby and pick a username your friends will recognize.
        </StepRow>
        <StepRow n="02" title="Get your bankroll">
          Everyone starts with{" "}
          <span className="bg-white px-1.5 font-bold tabular-nums text-black">
            {money(startingBalance)}
          </span>{" "}
          the moment they join.
        </StepRow>
        <StepRow n="03" title="Host starts the game" last>
          Once everyone is in, the host kicks it off and the first round begins.
        </StepRow>
      </div>
    </Page>,

    /* ---------------------------------------------------------------- *
     * 3 — Buy-in phase                                                 *
     * ---------------------------------------------------------------- */
    <Page>
      <PageHeader kicker="Phase 1 / Buy-in" index="03" />

      <Heading>Place your bets</Heading>

      <Lead>
        Before each round there is a short window to wager. When it closes, bets
        lock and the round begins.
      </Lead>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <OutlineBlock label="Set a wager">
          Choose how much to put on the line this round.
        </OutlineBlock>
        <FillBlock label="Max bet">
          <span className="block font-display text-[clamp(1.75rem,4vw,2.75rem)] leading-none tabular-nums !text-black">
            {money(maxBet)}
          </span>
          <span className="mt-2 block text-sm leading-snug !text-black">
            The most you can stake in one round, balance permitting.
          </span>
        </FillBlock>
        <OutlineBlock label="Bets lock">
          Once everyone is in, wagers close and the multiplier starts.
        </OutlineBlock>
      </div>
    </Page>,

    /* ---------------------------------------------------------------- *
     * 4 — During the round (signature page)                            *
     * ---------------------------------------------------------------- */
    <Page>
      <PageHeader kicker="Phase 2 / The round" index="04" />

      <Heading>Watch it climb</Heading>

      <Lead>
        A multiplier appears and moves with no fixed pattern. It can rise,
        stall, or fall at any moment.
      </Lead>

      <MultiplierTrack values={[1, 4, 7, 9, 6, 10, 8, 12]} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <div className="border-2 border-white p-4 sm:p-5">
          <p className="text-base font-bold sm:text-lg">Most rounds end low.</p>
          <p className="mt-1 text-sm leading-snug text-white/70 sm:text-base">
            But rare runs rocket past{" "}
            <span className="font-bold text-white tabular-nums">x50</span> for
            massive payouts.
          </p>
        </div>
        <div className="border-2 border-white p-4 sm:p-5">
          <p className="text-base font-bold sm:text-lg">Every second counts.</p>
          <p className="mt-1 text-sm leading-snug text-white/70 sm:text-base">
            Each one in raises your potential payout, and your odds of losing it
            all.
          </p>
        </div>
      </div>
    </Page>,

    /* ---------------------------------------------------------------- *
     * 5 — Cashing out                                                  *
     * ---------------------------------------------------------------- */
    <Page>
      <PageHeader kicker="Cashing out" index="05" />

      <Heading>Take the money</Heading>

      <Lead>
        Cash out any time before the crash. Your payout locks the instant you
        do, and nothing later in the round can touch it.
      </Lead>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-display text-[clamp(1.25rem,3.5vw,2.25rem)] uppercase leading-none">
        <span>Bet</span>
        <span className="text-white/40">×</span>
        <span>Multiplier</span>
        <span className="text-white/40">=</span>
        <span className="bg-white px-3 py-1.5 text-black">Payout</span>
      </div>

      <div className="border-t-2 border-white/15 pt-5">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.3em] text-white/50">
          For example
        </p>
        <p className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 font-display text-[clamp(1.5rem,4.5vw,3rem)] tabular-nums leading-none">
          <span>$20</span>
          <span className="text-white/40">×</span>
          <span>x6</span>
          <span className="text-white/40">=</span>
          <span>$120</span>
        </p>
        <p className="mt-3 text-sm text-white/60 sm:text-base">
          Locked in and added straight to your balance.
        </p>
      </div>
    </Page>,

    /* ---------------------------------------------------------------- *
     * 6 — Crash out (binary carried by inversion)                      *
     * ---------------------------------------------------------------- */
    <Page>
      <PageHeader kicker="The crash" index="06" />

      <Heading>Then it crashes</Heading>

      <Lead>
        At a random moment the multiplier drops to x0 and the round is over.
        Some rounds crash the instant they begin.
      </Lead>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        {/* Solid white: you walked away with something. */}
        <div className="bg-white p-5 text-black sm:p-6">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.25em] text-black/60">
            If you cashed out
          </p>
          <p className="mt-2 font-display text-2xl uppercase leading-none sm:text-3xl !text-black">
            You keep it all
          </p>
          <p className="mt-2 text-sm leading-snug text-black/70 sm:text-base">
            The crash cannot touch winnings you already locked in.
          </p>
        </div>
        {/* Hollow outline: you walked away with nothing. */}
        <div className="border-2 border-white p-5 sm:p-6">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.25em] text-white/50">
            If you were still in
          </p>
          <p className="mt-2 font-display text-2xl uppercase leading-none sm:text-3xl">
            You lose it all
          </p>
          <p className="mt-2 text-sm leading-snug text-white/70 sm:text-base">
            Your wager is gone. Payout is{" "}
            <span className="font-bold tabular-nums text-white">$0</span>.
          </p>
        </div>
      </div>
    </Page>,

    /* ---------------------------------------------------------------- *
     * 7 — Scoring & balance (calm ledger, no inversion)               *
     * ---------------------------------------------------------------- */
    <Page>
      <PageHeader kicker="Scoring / balance" index="07" />

      <Heading>How the money moves</Heading>

      <div className="grid grid-cols-1 gap-x-10 sm:grid-cols-2">
        <LedgerRow term="At cash out">
          Your payout is the multiplier at the exact moment you pull out.
        </LedgerRow>
        <LedgerRow term="Winnings">
          Added to your balance the instant you cash out.
        </LedgerRow>
        <LedgerRow term="Lost bets">
          Removed from your balance when the round ends.
        </LedgerRow>
        <LedgerRow term="Next round">
          You carry your balance from one round into the next.
        </LedgerRow>
      </div>
    </Page>,

    /* ---------------------------------------------------------------- *
     * 8 — Going broke + sign-off                                       *
     * ---------------------------------------------------------------- */
    <Page>
      <PageHeader kicker="House rule" index="08" />

      <Heading>Going broke</Heading>

      <div className="border-2 border-white p-5 sm:p-6">
        <p className="text-sm leading-snug text-white/80 sm:text-lg">
          First player to hit{" "}
          <span className="font-bold tabular-nums text-white">$0</span> takes a
          drink, gets a fresh{" "}
          <span className="font-bold tabular-nums text-white">
            {money(startingBalance)}
          </span>{" "}
          balance, and rejoins. Then the cycle starts over.
        </p>
      </div>

      <div className="bg-white p-6 text-black sm:p-8">
        <p className="font-display text-[clamp(2rem,6vw,3.5rem)] uppercase leading-[0.9] tracking-tight !text-black">
          Good luck
        </p>
        <p className="mt-2 text-base text-black/70 sm:text-lg">
          {"Trust me, you'll need it."}
        </p>
      </div>
    </Page>,
  ];
}

/* ================================================================== *
 * Shared building blocks                                             *
 * ================================================================== */

/**
 * Page
 *
 * The frame every instruction page sits in. Vertically centres its block and
 * keeps generous top/bottom padding so the dialog's floating title and OK
 * button never overlap the copy. Content is left aligned on purpose to avoid
 * the centred-hero look; the block as a whole is what gets centred.
 * overflow-y-auto is a safety net for very short viewports.
 */
function Page({ children }) {
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
 */
function PageHeader({ kicker, index }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="rounded-lg border-2 border-white px-3 py-1 text-[0.7rem] font-bold uppercase tracking-[0.25em] sm:text-xs">
        {kicker}
      </span>
      <span className="font-display text-sm tabular-nums tracking-widest text-white/50 sm:text-base">
        {index} / {TOTAL}
      </span>
    </div>
  );
}

/**
 * Heading
 *
 * The page's display line. Brand face, uppercase, very tight leading.
 */
function Heading({ children }) {
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
function Lead({ children }) {
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
 * joining the table genuinely is a sequence.
 *
 * @param {string} n                  Step number, e.g. "01".
 * @param {string} title              Step title.
 * @param {React.ReactNode} children  Step description.
 * @param {boolean} [last]            Drops the bottom rule on the final row.
 */
function StepRow({ n, title, children, last }) {
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
function OutlineBlock({ label, children }) {
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
function FillBlock({ label, children }) {
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
 * scoring page, which is intentionally the one page with no inversion.
 *
 * @param {string} term               Short label for the rule.
 * @param {React.ReactNode} children  Description.
 */
function LedgerRow({ term, children }) {
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

/**
 * MultiplierTrack
 *
 * The manual's signature element: the example run as a row of pills. A pill is
 * filled (solid white) when the value rose from the previous one and hollow
 * (outline) when it fell, so the game's volatility is encoded by inversion
 * rather than colour. Both variants carry border-2 so filled and hollow pills
 * are the same size and stay aligned. Wraps on narrow screens; the trailing
 * ellipsis hints the run can keep going.
 *
 * @param {number[]} values  The sequence of multipliers to display.
 */
function MultiplierTrack({ values }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-2 border-white p-4 sm:gap-2.5 sm:p-5">
      {values.map((v, i) => {
        const rose = i === 0 || v >= values[i - 1];
        return (
          <Fragment key={i}>
            <span
              className={
                "font-display tabular-nums leading-none px-2.5 py-1.5 text-base sm:px-3 sm:py-2 sm:text-2xl " +
                (rose
                  ? "border-2 border-white bg-white text-black"
                  : "border-2 border-white text-white")
              }
            >
              x{v}
            </span>
            {i < values.length - 1 && (
              <span aria-hidden="true" className="text-white/30">
                →
              </span>
            )}
          </Fragment>
        );
      })}
      <span aria-hidden="true" className="text-lg font-bold text-white/40 sm:text-2xl">
        …
      </span>
    </div>
  );
}