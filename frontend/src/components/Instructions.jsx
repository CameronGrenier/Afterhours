import { useState } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

import { ArrowBigRightDash, ArrowBigLeftDash, CircleX } from "lucide-react";

/**
 * Instructions
 *
 * A fullscreen, paged modal built on the native <dialog> element. It shows one
 * "page" of instructions at a time and lets the user step through them with
 * left/right arrows. Layout switches between a desktop and a mobile variant at
 * the 1300px breakpoint.
 *
 * --- HOW TO OPEN / CLOSE IT (important) ---
 * This component does NOT render its own open state. Opening is imperative:
 * the parent holds a ref to the underlying <dialog> and calls showModal() on it.
 *
 *   const ref = useRef(null);
 *   ...
 *   <Instructions ref={ref} instructions={pages} />
 *   <button onClick={() => ref.current?.showModal()}>Open</button>
 *
 * Closing happens three ways, all automatic:
 *   - The "OK" button (inside a <form method="dialog">) closes it natively.
 *   - The mobile X button calls ref.current.close().
 *   - Esc closes it (free browser behavior for modal dialogs).
 *
 * Because showModal() is used, the browser handles the focus trap, makes the
 * rest of the page inert, renders above all other content (top layer), and
 * provides the ::backdrop used for the blur. None of that is hand-rolled here.
 *
 * --- PROPS ---
 * @param {React.Ref<HTMLDialogElement>} ref
 *   Forwarded straight onto the <dialog>. The parent calls showModal()/close()
 *   on ref.current. (React 19 style: ref is received as a normal prop.)
 *
 * @param {React.ReactNode[]} instructions
 *   The pages to show, as an array of renderable elements. One is displayed at
 *   a time, chosen by an internal index. Shape:
 *
 *     [
 *       <div className="...">Page one content</div>,
 *       <div className="...">Page two content</div>,
 *       <div className="...">Page three content</div>,
 *     ]
 *
 *   Rules the next dev should know:
 *     - Must contain at least one element. An empty array disables paging and
 *       renders nothing in the content slot (guarded below).
 *     - Array order IS page order. The right arrow advances, the left arrow
 *       goes back, and both wrap around at the ends.
 *     - Elements are selected by index and never mapped, so they do NOT need
 *       React `key` props. If you refactor to .map() them, add keys.
 *     - Each element brings its own internal layout. The dialog only centers
 *       it; it does not impose width/height on the page content.
 *
 * --- HOW TO MODIFY ---
 *   - Add/remove pages: just change the `instructions` array passed in. No
 *     code changes here are needed; wrap-around adapts to the new length.
 *   - Change the breakpoint: edit the useMediaQuery query below.
 *   - Restyle the parallelogram: it is the -skew-x-8 box in DesktopDialog. The
 *     title/OK overlay is a separate, un-skewed sibling layered on top, so edit
 *     them independently.
 *
 * --- KNOWN LIMITATION ---
 * Resizing across the 1300px breakpoint while open swaps which dialog component
 * is mounted, which destroys and recreates the <dialog> and closes it. If the
 * dialog must survive a resize, this needs to be reworked to render one dialog
 * and switch only its inner layout, but why would the dialog need to resize...
 */
export default function Instructions({ ref, instructions }) {
  const isMobile = useMediaQuery("(max-width: 1300px)");
  const [instructionsIndex, setInstructionsIndex] = useState(0);

  const count = instructions.length;

  // Step forward/back with wrap-around. The "+ count" before the modulo keeps
  // the result positive when stepping back from index 0.
  // Guarded so an empty array can't produce a NaN index.
  const next = () =>
    setInstructionsIndex((prev) => (count ? (prev + 1) % count : 0));
  const prev = () =>
    setInstructionsIndex((prev) => (count ? (prev - 1 + count) % count : 0));

  // content is undefined when instructions is empty; the dialogs render an
  // empty slot in that case rather than crashing.
  const content = instructions[instructionsIndex];

  return (
    <>
      {!isMobile ? (
        <DesktopDialog ref={ref} content={content} next={next} prev={prev} />
      ) : (
        <MobileDialog ref={ref} content={content} next={next} prev={prev} />
      )}
    </>
  );
}

/**
 * DesktopDialog
 *
 * Three-column layout: [ left arrow | center panel | right arrow ].
 * The center panel is a skewed parallelogram holding the page content, with an
 * un-skewed overlay (title + OK button) layered on top so those two read
 * upright while straddling the panel's top and bottom borders.
 */
function DesktopDialog({ ref, content, next, prev }) {
  return (
    <dialog
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full open:grid grid-cols-[auto_1fr_auto] gap-[100px] place-items-center backdrop:backdrop-blur-sm bg-transparent p-4 z-[9999]"
      ref={ref}
    >
      {/* Left arrow steps to the PREVIOUS page. */}
      <NavigationButton icon={ArrowBigLeftDash} size={40} onClick={prev} />

      {/* Center column: skewed shape underneath, upright title/OK overlay on top. */}
      <div className="relative w-full max-w-[1800px] h-[80%]">
        {/* Parallelogram. Its content is counter-skewed so it renders upright. */}
        <div className="absolute inset-0 bg-black border-2 border-white -skew-x-8 rounded-2xl">
          <div className="skew-x-8 w-full h-full flex items-center justify-center p-2">
            {content}
          </div>
        </div>

        {/* Upright overlay. pointer-events-none lets clicks fall through to the
            content/backdrop; the OK button re-enables pointer events on itself. */}
        <div className="absolute inset-0 flex flex-col justify-between items-center pointer-events-none">
          <h2 className="-skew-x-8 -translate-y-1/2 px-12 py-4 bg-black border-2 border-white rounded-xl text-[clamp(1em,3vw,4em)] font-bold text-white tracking-tight whitespace-nowrap">
            Instructions
          </h2>

          {/* method="dialog" makes this submit button close the dialog natively. */}
          <form method="dialog" className="-skew-x-8 translate-y-1/2 pointer-events-auto">
            <button className="flex items-center justify-center bg-white text-black text-4xl font-bold rounded-xl px-24 py-8 border-2 border-black hover:bg-black hover:border-white hover:text-white focus-visible:bg-black focus-visible:border-white focus-visible:text-white cursor-pointer">
              OK
            </button>
          </form>
        </div>
      </div>

      {/* Right arrow steps to the NEXT page. */}
      <NavigationButton icon={ArrowBigRightDash} size={40} onClick={next} />
    </dialog>
  );
}

/**
 * MobileDialog
 *
 * Fullscreen, three-row layout: [ header | content | footer arrows ].
 * The w-screen/h-screen + max-w-none/max-h-none + m-0 combo overrides the
 * browser's default dialog max-size and centering so it fills the viewport.
 */
function MobileDialog({ ref, content, next, prev }) {
  return (
    <dialog
      className="open:grid grid-rows-[auto_1fr_auto] gap-4 bg-black w-screen h-screen max-w-none max-h-none m-0 p-0 top-0 left-0 z-[999999]"
      ref={ref}
    >
      {/* Header row: title + close (X). */}
      <div className="w-full flex items-center justify-between p-4 border-b-2 border-white/24">
        <p className="font-bold text-4xl tracking-tight text-white truncate">Instructions</p>
        <button
          className="cursor-pointer shrink-0"
          onClick={() => ref.current?.close()}
          aria-label="close instructions"
        >
          <CircleX size={40} color="#ffffff" />
        </button>
      </div>

      {/* Content row: fills remaining vertical space, centers the page. */}
      <div className="w-full h-full flex items-center justify-center">
        {content}
      </div>

      {/* Footer row: left = previous, right = next. */}
      <div className="w-full flex justify-between p-4">
        <NavigationButton icon={ArrowBigLeftDash} size={24} onClick={prev} />
        <NavigationButton icon={ArrowBigRightDash} size={24} onClick={next} />
      </div>
    </dialog>
  );
}

/**
 * NavigationButton
 *
 * Square icon button used for paging. The icon uses mix-blend-difference so it
 * stays visible when the button background flips to white on hover/focus.
 *
 * @param {React.ComponentType} icon  A lucide-react icon component (passed by
 *                                    reference, e.g. ArrowBigLeftDash, then
 *                                    rendered as <Icon /> inside).
 * @param {number} size               Icon size in px.
 * @param {() => void} onClick        Click handler (pass the handler itself,
 *                                    not a call: onClick={next}, not next()).
 */
function NavigationButton({ icon: Icon, size, onClick }) {
  return (
    <button
      className="p-3 flex items-center justify-center rounded-2xl border-2 border-white bg-black aspect-square cursor-pointer hover:bg-white focus-visible:bg-white"
      onClick={onClick}
    >
      <Icon color="white" size={size} strokeWidth={2} className="mix-blend-difference" />
    </button>
  );
}