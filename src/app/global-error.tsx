"use client";

/**
 * Last-resort boundary: this replaces the root layout, so it can't use any of the site's fonts,
 * theme tokens or components. Keep it self-contained and plain.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "1.5rem",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#fdfaf6",
          color: "#2a2226",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 500, margin: 0 }}>Something went wrong</h1>
        <p style={{ margin: 0, maxWidth: "24rem", lineHeight: 1.6 }}>
          GlowNest couldn&apos;t load. Please try again, or call 91 71 90 63 to book.
        </p>
        <button
          onClick={reset}
          style={{
            minHeight: "3rem",
            padding: "0 2rem",
            borderRadius: "0.5rem",
            border: "none",
            background: "#5b2a4e",
            color: "#fff",
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
        {error.digest && (
          <p style={{ margin: 0, fontSize: "0.75rem", opacity: 0.6 }}>Reference: {error.digest}</p>
        )}
      </body>
    </html>
  );
}
