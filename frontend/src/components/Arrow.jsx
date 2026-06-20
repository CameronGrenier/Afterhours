import { useId } from "react";

export default function Arrow({ d, className, strokeWidth = 2 }) {
  const markerId = useId();

  return (
    <svg viewBox="0 0 120 80" fill="none" className={className} aria-hidden="true">
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="7"
          refY="5"
          markerWidth="5"          /* in stroke-width units (default markerUnits) */
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M -0 -0 L 8 5 L -0 10" stroke="currentColor" strokeWidth="1.8"
                fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
      </defs>

      <path
        d={d}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        markerEnd={`url(#${markerId})`}
      />
    </svg>
  );
}