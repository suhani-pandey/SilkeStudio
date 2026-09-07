type IconProps = { className?: string };

export function InstagramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
    </svg>
  );
}

export function FacebookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M13.5 21v-6.8h2.2l.3-2.6h-2.5V9.9c0-.75.2-1.26 1.28-1.26h1.37V5.35C15.7 5.24 14.9 5.17 14 5.17c-2.1 0-3.5 1.28-3.5 3.63v2.02H8.3v2.6h2.2V21"
        fill="currentColor"
      />
    </svg>
  );
}

export function TikTokIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M14 3.5c.4 2.1 1.8 3.5 4 3.7v2.6a6.9 6.9 0 0 1-4-1.3v6.1a5.4 5.4 0 1 1-5.4-5.4c.3 0 .6 0 .9.07v2.7a2.7 2.7 0 1 0 1.9 2.6V3.5H14Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}
