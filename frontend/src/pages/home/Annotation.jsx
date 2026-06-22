import Arrow from "@/components/Arrow";

/**
 * Annotation Component
 *
 * Renders a decorative SVG line with a text label to annotate UI elements.
 * Used to highlight important features on the home screen.
 *
 * @param {string} d - SVG path data for the arrow line
 * @param {string} label - Text label to display
 * @param {string} className - Position and layout classes for the annotation container
 * @param {string} labelClassName - Text positioning and styling classes
 * @param {number} width - Width of the annotation container
 * @param {number} height - Height of the annotation container
 * @returns {React.ReactNode} Annotation element
 */

export default function Annotation({ d, label, className, labelClassName, width, height }) {
  return (
    <div
      aria-hidden="true"
      style={{ width, height }}
      className={`pointer-events-none absolute ${className}`}
    >
      {/* SVG line/arrow pointing to the annotated element */}
      <Arrow d={d} className="text-white absolute inset-0 w-full h-full" />

      {/* Text label for the annotation */}
      <span
        className={`absolute font-thin text-xl text-white leading-[1] tracking-tight text-center ${labelClassName}`}
      >
        {label}
      </span>
    </div>
  );
}
