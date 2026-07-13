/**
 * Input Component
 *
 * A styled text input field with consistent styling across the app.
 * Handles various input types and allows customization through props.
 *
 * Styling Features:
 *   - Centered text with 2px black border
 *   - White background with rounded corners
 *   - Focus state hides placeholder text
 *   - Text is gray (#b5bcc2) in normal state
 *
 * @param {string} type - HTML input type (e.g., "text", "email", "password")
 * @param {string} placeholderText - Placeholder text displayed when input is empty
 * @param {Function} onChange - Callback function when input value changes
 *                               Receives the input value as a string
 * @param {string} [className] - Additional CSS classes to apply (optional)
 * @returns {React.ReactNode} Input element
 */
function Input({ type, placeholderText, onChange, className, value }) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholderText}
      autoComplete="off"
      className={`mx-auto block w-full rounded-md border-2 border-black bg-white py-3 text-center text-2xl text-gray-700 font-medium outline-none focus:placeholder:text-transparent ${className}`}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export default Input;