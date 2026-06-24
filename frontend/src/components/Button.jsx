/**
 * Button Component
 *
 * A reusable button element with multiple visual variants. Handles styling for
 * different button types (primary dark, light, and danger) with consistent hover
 * and focus states for accessibility.
 *
 * Variants:
 *   - "dark" (default): Black background with white text, inverts on hover
 *   - "light": White background with black text, inverts on hover
 *   - "danger": Red background with white text, inverts on hover
 *
 * @param {string} variant           - Button style variant ("dark", "light", or "danger")
 * @param {boolean} disabled         - Disabled flag to disable click functionality
 * @param {string} ariaLabel         - Accessibility label for screen readers
 * @param {Function} onClick         - Click event handler
 * @param {React.ReactNode} children - Button label or nested content
 * @returns {React.ReactNode} Button element
 */
export default function Button({ variant, disabled, ariaLabel, onClick, children }) {
  // =========================================================================
  // Style Configuration
  // =========================================================================
  let base, hover, focus;

  switch (variant) {
    case "dark":
      base = "bg-black text-white border-white";
      hover = "hover:bg-white hover:text-black hover:border-black";
      focus = "focus-visible:bg-white focus-visible:text-black focus-visible:border-black";
      break;

    case "light":
      base = "bg-white text-black border-black";
      hover = "hover:bg-black hover:text-white hover:border-black";
      focus = "focus-visible:bg-black focus-visible:text-white focus-visible:border-black";
      break;

    case "danger":
      base = "bg-danger text-white border-danger";
      hover = "hover:bg-white hover:text-danger hover:border-danger";
      focus = "focus-visible:bg-white focus-visible:text-danger focus-visible:border-danger";
      break;

    default:
      base = "bg-black text-white border-white";
      hover = "hover:bg-white hover:text-black hover:border-black";
      focus = "focus-visible:bg-white focus-visible:text-black focus-visible:border-black";
  }
  const hoverStyles = disabled? '' : `${hover} ${focus}`
  const buttonStyle = `${base} ` + hoverStyles;

  // =========================================================================
  // Render
  // =========================================================================
  return (
    <button
      className={`w-full rounded-md px-16 py-4 text-2xl font-bold border-2 ${!disabled && 'cursor-pointer'} transition-colors duration-200 ${buttonStyle}`}
      aria-label={ariaLabel}
      onClick={disabled? null : onClick}
    >
      {children}
    </button>
  );
}