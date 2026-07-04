"use client";

import { useEffect } from "react";
import { ERROR_SCREEN_COPY } from "./error-screen-copy";

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
          {ERROR_SCREEN_COPY.title}
        </h1>
        <p
          style={{
            maxWidth: "420px",
            color: "rgba(255,255,255,0.6)",
            lineHeight: 1.6,
          }}
        >
          {ERROR_SCREEN_COPY.body}
        </p>
        <div
          style={{
            marginTop: "24px",
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            justifyContent: "center",
          }}
        >
          <button
            type="button"
            onClick={reset}
            style={{
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
            {ERROR_SCREEN_COPY.primaryAction}
          </button>
          <a
            href={ERROR_SCREEN_COPY.homeHref}
            style={{
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "3px",
              color: "rgba(255,255,255,0.78)",
              padding: "12px 24px",
              fontWeight: 700,
              textDecoration: "none",
              textTransform: "uppercase",
              letterSpacing: "0.2em",
            }}
          >
            {ERROR_SCREEN_COPY.secondaryAction}
          </a>
        </div>
      </body>
    </html>
  );
}
