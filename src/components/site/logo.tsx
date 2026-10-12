import { cn } from "@/lib/utils";

/**
 * Drawn inline rather than loaded as an image so the wordmark is set in the site's own Garamond
 * (an SVG loaded through <img> can't see web fonts) and takes its colours from wherever it sits:
 * cream and yellow on the green ground, green on an ivory surface.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 300 96"
      width={300}
      height={96}
      role="img"
      aria-label="Silke Studio"
      className={cn("h-10 w-auto", className)}
    >
      {/* A needle drawing its thread: the one mark both halves of the business share. */}
      <g className="stroke-highlight" fill="none" strokeWidth={2} strokeLinecap="round">
        <path d="M18 62 L54 26" />
        <circle cx="20" cy="60" r="3.2" />
        <path d="M54 26 C 62 18, 72 22, 70 32 C 68 41, 56 42, 58 32" />
      </g>
      <text
        x="88"
        y="54"
        className="font-heading fill-current"
        fontSize="48"
        fontWeight="500"
        letterSpacing="7"
      >
        SILKE
      </text>
      <text
        x="90"
        y="78"
        className="fill-highlight font-heading"
        fontSize="16"
        fontWeight="500"
        letterSpacing="9"
      >
        STUDIO
      </text>
    </svg>
  );
}
