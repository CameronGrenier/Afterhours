// Button.jsx
//   All based on the wireframes in our discord
//   dark: Host on Username screen, Join, Start
//   light: Host on Landing, "Waiting for Host"
//   cancel: Cancel, Leave
const VARIANTS = {
  dark: "bg-black text-white border border-white/15 hover:bg-[#1c1c1c]",
  light: "bg-white text-black border border-black/10 hover:bg-[#e6e6e6]",
  cancel: "bg-[#e5342e] text-white border border-transparent hover:bg-[#c62c27]",
};

export default function Button({
  variant = "dark",
  children,
  className = "",
  ...props
}) {
  return (
    <button
      type="button"
      className={`font-sans font-medium text-sm px-4 py-2 rounded-sm transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
        VARIANTS[variant] ?? VARIANTS.dark
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
