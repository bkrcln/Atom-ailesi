export default function Logo({ boyut = 52 }) {
  return (
    <svg viewBox="0 0 64 64" width={boyut} height={boyut} aria-hidden="true">
      <g fill="none" stroke="#FFD23F" strokeWidth="2.6">
        <ellipse cx="32" cy="32" rx="28" ry="10.5" />
        <ellipse cx="32" cy="32" rx="28" ry="10.5" transform="rotate(60 32 32)" />
        <ellipse cx="32" cy="32" rx="28" ry="10.5" transform="rotate(-60 32 32)" />
      </g>
      <circle cx="28.5" cy="30.5" r="6.2" fill="#FF5A6E" stroke="#fff" strokeWidth="1.6" />
      <circle cx="35.5" cy="34" r="6.2" fill="#4D8BFF" stroke="#fff" strokeWidth="1.6" />
      <circle cx="60" cy="32" r="4.2" fill="#FFD23F" stroke="#fff" strokeWidth="1.2" />
    </svg>
  );
}
