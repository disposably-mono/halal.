"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary for errors thrown in the root layout itself. Because it
 * replaces the entire document, it renders its own <html>/<body> and uses inline
 * styles so it still displays even if the stylesheet failed to load.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

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
          background: "#0f1235",
          color: "#ffffff",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "40px", letterSpacing: "0.05em" }}>
          Something went wrong
        </h1>
        <p
          style={{
            maxWidth: "420px",
            color: "rgba(255,255,255,0.6)",
            lineHeight: 1.6,
          }}
        >
          An unexpected error interrupted your request. Please try again.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: "24px",
            background: "#F5C000",
            color: "#1B1F5E",
            border: "none",
            borderRadius: "3px",
            padding: "12px 24px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            cursor: "pointer",
          }}
        >
          Try Again
        </button>
      </body>
    </html>
  );
}
