export default function GluonDedeAvatar({ boyut = 44 }) {
  return (
    <svg viewBox="0 0 48 48" width={boyut} height={boyut} aria-hidden="true">
      <circle cx="24" cy="21" r="16" fill="#F5B83D" stroke="#fff" strokeWidth="2" />
      <circle cx="18.5" cy="19" r="3.4" fill="#fff" /><circle cx="29.5" cy="19" r="3.4" fill="#fff" />
      <circle cx="18.5" cy="19.6" r="2" fill="#1A1D47" /><circle cx="29.5" cy="19.6" r="2" fill="#1A1D47" />
      <path d="M19 26q5 4 10 0" fill="none" stroke="#1A1D47" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 38c2-4 4 4 6 0s4 4 6 0 4 4 6 0 4 4 6 0 4 4 6 0" fill="none" stroke="#FFF3C4" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
