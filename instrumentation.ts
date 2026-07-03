/**
 * OpenTelemetry bootstrap (HANDOFF.md section 6). Registered automatically by
 * Next.js 16 on server startup (both the Node.js runtime and the Edge runtime
 * used by `proxy.ts` call `register()` — this file only wires up tracing for
 * the former; the latter is a no-op below).
 *
 * Off by default: nothing is exported and no exporter is configured unless
 * `OTEL_EXPORTER_OTLP_ENDPOINT` is set, so a plain `npm run dev` / CI run never
 * pays for tracing overhead or needs a collector running.
 *
 * See lib/server/otel.ts for the span-attribute allowlist that every custom
 * span in this app must go through — that's where the privacy rule from this
 * section (no voterCode/studentId/receipt/officer-key/password material, no
 * per-candidate selections) is actually enforced.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (!process.env.OTEL_EXPORTER_OTLP_ENDPOINT) return;

  const { registerOTel } = await import("@vercel/otel");
  const { PrismaInstrumentation } = await import("@prisma/instrumentation");

  registerOTel({
    serviceName: process.env.OTEL_SERVICE_NAME ?? "halal-election",
    instrumentations: [new PrismaInstrumentation()],
  });
}
