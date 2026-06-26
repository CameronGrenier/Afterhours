import { Fragment } from "react";
import { Bomb } from "lucide-react";
import {
  Page,
  PageHeader,
  Heading,
  Lead,
  StepRow,
  OutlineBlock,
  FillBlock,
} from "./shared";

/**
 * SlangInstructions
 *
 * Pages for the Slang! game, ready to hand straight to <Instructions />:
 *
 *   import Instructions from "@/components/Instructions";
 *   import SlangInstructions from "@/instructions/SlangInstructions";
 *
 *   const pages = SlangInstructions({ lives: 3, turnSeconds: 15, voteThreshold: 40, minWordLength: 3 });
 *   <Instructions ref={ref} instructions={pages} />
 *
 * The configurable gameplay values (lives, turn timer, vote threshold, minimum
 * word length) are passed in so the manual always shows the numbers players
 * actually play with. Slang! is always a drinking game: the drinking
 * consequences are baked into the Lives and Elimination pages rather than
 * gated behind a toggle.
 *
 * @param {object}  [config]
 * @param {number}  [config.lives=3]           Lives each player starts with.
 * @param {number}  [config.turnSeconds=15]    Seconds a player has per turn / vote.
 * @param {number}  [config.voteThreshold=40]  % of other players whose bullsh*t
 *                                              votes reject a word (strictly greater).
 * @param {number}  [config.minWordLength=3]   Minimum letters a word must have.
 * @returns {import("react").ReactNode[]} One element per page, in page order.
 *
 * ------------------------------------------------------------------ *
 * DESIGN SYSTEM
 *   Shares the flat, white/black, font-display system documented in
 *   ./shared.jsx. Generic blocks (Page, Heading, Lead, StepRow, OutlineBlock,
 *   FillBlock, LedgerRow) are imported from there; WordChain is local to this
 *   manual and is its signature element (analogous to Crash Out's
 *   MultiplierTrack).
 *
 * NOTE FOR THE NEXT DEV
 *   - Pages are plain elements selected by index (never .map()'d), so they
 *     need no key prop, matching how <Instructions /> consumes them.
 *   - TOTAL below feeds the "/ 07" page counter. If you add or remove a page,
 *     update TOTAL.
 * ------------------------------------------------------------------ *
 */

const TOTAL = "07";

export default function SlangInstructions({
  lives = 3,
  turnSeconds = 15,
  voteThreshold = 40,
  minWordLength = 3,
} = {}) {
  return [
    /* ---------------------------------------------------------------- *
     * 1 — Objective                                                     *
     * ---------------------------------------------------------------- */
    <Page>
      <PageHeader kicker="How to play" index="01" total={TOTAL} />

      <Heading>
        Keep the
        <br />
        chain alive.
      </Heading>

      <Lead>
        Players take turns dropping slang words. Each new word has to start with
        the last letter of the word before it. Break the chain and you lose a
        life.
      </Lead>

      <div className="bg-white p-5 text-black sm:p-6">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.3em] !text-black/60">
          The stakes
        </p>
        <p className="mt-2 font-display text-2xl uppercase leading-none sm:text-3xl !text-black">
          {lives} lives each
        </p>
        <p className="mt-2 text-sm leading-snug text-black/70 sm:text-base">
          Lose all {lives} and you are out, and the first one out takes the
          punishment shot.
        </p>
      </div>
    </Page>,

    /* ---------------------------------------------------------------- *
     * 2 — Getting started                                              *
     * ---------------------------------------------------------------- */
    <Page>
      <PageHeader kicker="Getting started" index="02" total={TOTAL} />

      <Heading>Get in the lobby</Heading>

      <div className="flex flex-col">
        <StepRow n="01" title="Join the lobby">
          Enter the room code and pick a username your friends will recognize.
        </StepRow>
        <StepRow n="02" title="Ready up">
          Everyone marks themselves ready, then the host starts the game.
        </StepRow>
        <StepRow n="03" title="Take the first letter" last>
          A random starting letter is handed to the first player. Turn order
          follows join order, then locks into a fixed rotation for the rest of
          the game.
        </StepRow>
      </div>
    </Page>,

    /* ---------------------------------------------------------------- *
     * 3 — How each turn works (signature page)                         *
     * ---------------------------------------------------------------- */
    <Page>
      <PageHeader kicker="Each turn" index="03" total={TOTAL} />

      <Heading>Drop a word</Heading>

      <Lead>
        On your turn you have{" "}
        <span className="font-bold tabular-nums text-white">{turnSeconds}</span>{" "}
        seconds to submit a slang word in the chosen category.
      </Lead>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <OutlineBlock label="Last-letter link">
          It must start with the last letter of the previous word. The very
          first player is the only exception.
        </OutlineBlock>
        <OutlineBlock label="Minimum length">
          Every word must be at least{" "}
          <span className="font-bold tabular-nums text-white">
            {minWordLength}
          </span>{" "}
          letters long.
        </OutlineBlock>
      </div>

      <WordChain words={["Swag", "Gang", "Gucci", "illest", "thicc"]} />
    </Page>,

    /* ---------------------------------------------------------------- *
     * 4 — Word validation                                              *
     * ---------------------------------------------------------------- */
    <Page>
      <PageHeader kicker="Validation" index="04" total={TOTAL} />

      <Heading>Real word?</Heading>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <FillBlock label="In the database">
          <span className="block font-display text-xl uppercase leading-none !text-black sm:text-2xl">
            Auto-pass
          </span>
          <span className="mt-1.5 block text-sm leading-snug !text-black/70">
            Recognized words clear instantly, no vote.
          </span>
        </FillBlock>
        <OutlineBlock label="Unknown word">
          Goes to a{" "}
          <span className="font-bold tabular-nums text-white">
            {turnSeconds}
          </span>
          s bullsh*t vote. More than{" "}
          <span className="font-bold tabular-nums text-white">
            {voteThreshold}%
          </span>{" "}
          voting bullsh*t rejects it and costs a life.
        </OutlineBlock>
      </div>

      <ThresholdBar threshold={voteThreshold} />
    </Page>,

    /* ---------------------------------------------------------------- *
     * 5 — Lives                                                        *
     * ---------------------------------------------------------------- */
    <Page>
      <PageHeader kicker="Lives" index="05" total={TOTAL} />

      <Heading>Losing a life</Heading>

      <Lives total={lives} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <OutlineBlock label="Voted out">
          More than{" "}
          <span className="font-bold tabular-nums text-white">
            {voteThreshold}%
          </span>{" "}
          of the other players call bullsh*t on your word.
        </OutlineBlock>
        <OutlineBlock label="Out of time">
          The{" "}
          <span className="font-bold tabular-nums text-white">
            {turnSeconds}
          </span>
          s timer hits zero before you submit a valid word.
        </OutlineBlock>
      </div>

      <div className="border-2 border-white p-5 sm:p-6">
        <p className="text-sm leading-snug text-white/80 sm:text-lg">
          Losing a life ends the current round. A new round starts with the next
          player getting a fresh starting letter, and the chain restarts.{" "}
          <span className="font-bold text-white">
            Take a drink every time you lose a life.
          </span>
        </p>
      </div>
    </Page>,

    /* ---------------------------------------------------------------- *
     * 6 — Elimination (inversion focal)                                *
     * ---------------------------------------------------------------- */
    <Page>
      <PageHeader kicker="Elimination" index="06" total={TOTAL} />

      <Heading>Out of lives</Heading>

      <Lead>
        Lose all {lives} lives and you "Black Out". The first player to Black Out takes the shot and the game ends.
      </Lead>

      <div className="bg-white p-6 text-black sm:p-8">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.25em] !text-black/60">
          First one out
        </p>
        <p className="mt-2 font-display text-[clamp(2rem,6vw,3.5rem)] uppercase leading-[0.9] tracking-tight !text-black">
          Black out
        </p>
        <p className="mt-2 text-base text-black/70 sm:text-lg">
          The first player eliminated takes the shot. No appeals.
        </p>
      </div>
    </Page>,

    /* ---------------------------------------------------------------- *
     * 7 — Single-page rule card                                        *
     * ---------------------------------------------------------------- */
    <Page>
      <PageHeader kicker="Quick rules" index="07" total={TOTAL} />

      <Heading>The whole game</Heading>

      <div className="grid grid-cols-1 gap-x-10 sm:grid-cols-2">
        <RuleItem term="Last-letter link">
          Each word starts with the previous word's last letter.
        </RuleItem>
        <RuleItem term="Minimum length">
          Words must be at least {minWordLength} letters.
        </RuleItem>
        <RuleItem term="Turn timer">
          You get {turnSeconds} seconds per turn.
        </RuleItem>
        <RuleItem term="Known words">
          In the database? Auto-pass, no vote.
        </RuleItem>
        <RuleItem term="Unknown words">
          Go to a bullsh*t vote of the other players.
        </RuleItem>
        <RuleItem term="Rejected">
          More than {voteThreshold}% bullsh*t = lose a life.
        </RuleItem>
        <RuleItem term="Round reset">
          Losing a life ends the round; the chain restarts.
        </RuleItem>
        <RuleItem term="Turn order">
          Random first letter, then a fixed rotation.
        </RuleItem>
        <RuleItem term="Elimination">
          First to lose all {lives} lives loses and takes the shot.
        </RuleItem>
        <RuleItem term="Drinking rule">
          Drink every time you lose a life.
        </RuleItem>
      </div>
    </Page>,
  ];
}

/* ================================================================== *
 * Slang-specific building blocks                                     *
 * ================================================================== */

/**
 * WordChain
 *
 * The manual's signature element: the example chain as a row of word "pills"
 * joined by → arrows with a trailing ellipsis. Pills alternate between filled
 * (solid white) and hollow (outline) so the inversion design language carries
 * the rhythm, mirroring Crash Out's MultiplierTrack. Both variants carry
 * border-2 so filled and hollow pills stay the same size. Wraps on narrow
 * screens; the trailing ellipsis hints the chain keeps going.
 *
 * @param {string[]} words  The sequence of words to display.
 */
function WordChain({ words }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-2 border-white p-4 sm:gap-2.5 sm:p-5">
      {words.map((w, i) => {
        const filled = i % 2 === 0;
        return (
          <Fragment key={i}>
            <span
              className={
                "font-display uppercase leading-none px-2.5 py-1.5 text-base sm:px-3 sm:py-2 sm:text-2xl " +
                (filled
                  ? "border-2 border-white bg-white text-black"
                  : "border-2 border-white text-white")
              }
            >
              {w}
            </span>
            {i < words.length - 1 && (
              <span aria-hidden="true" className="text-white/30">
                →
              </span>
            )}
          </Fragment>
        );
      })}
      <span
        aria-hidden="true"
        className="text-lg font-bold text-white/40 sm:text-2xl"
      >
        …
      </span>
    </div>
  );
}

/**
 * Lives
 *
 * A small row of pips representing the lives a player starts with: filled
 * (solid white) squares, on-brand and matching the inversion language.
 *
 * @param {number} total  How many life pips to render.
 */
function Lives({ total }) {
  return (
    <div className="flex items-center gap-2 sm:gap-3" aria-label={`${total} lives`}>
      {Array.from({ length: total }).map((_, i) => (
        <Bomb
          key={i}
          aria-hidden="true"
          className="h-6 w-6 sm:h-8 sm:w-8"
        />
      ))}
    </div>
  );
}

/**
 * ThresholdBar
 *
 * A single bar visualising the bullsh*t-vote threshold: the filled (solid
 * white) portion is the share of other players that must vote bullsh*t to
 * reject a word. Encodes the number rather than decorating it.
 *
 * @param {number} threshold  The reject threshold as a percentage (0–100).
 */
function ThresholdBar({ threshold }) {
  return (
    <div className="border-2 border-white p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.25em] text-white/50">
          Reject threshold
        </p>
        <p className="font-display text-base tabular-nums sm:text-xl">
          &gt;{threshold}%
        </p>
      </div>
      <div className="mt-3 flex h-4 w-full border-2 border-white">
        <span
          className="block h-full bg-white"
          style={{ width: `${threshold}%` }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

/**
 * RuleItem
 *
 * A compact single-row reference entry for the quick-rules card: a thin top
 * rule, the bold term, then its description on the same line (wrapping if
 * needed). Tighter than LedgerRow so all ten rules fit one desktop screen
 * without scrolling.
 *
 * @param {string} term               Short label for the rule.
 * @param {React.ReactNode} children  Description.
 */
function RuleItem({ term, children }) {
  return (
    <div className="border-t-2 border-white/15 py-4">
      <p className="text-sm leading-snug sm:text-base">
        <span className="font-bold uppercase tracking-tight text-white">
          {term}.
        </span>{" "}
        <span className="text-white/60">{children}</span>
      </p>
    </div>
  );
}
