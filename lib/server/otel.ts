/**
 * Shared tracing helper for HANDOFF.md section 6. `withSpan` is the only
 * sanctioned way to attach attributes to a span in this codebase: it enforces
 * the privacy allowlist below before anything reaches an exporter, so a new
 * call site can't leak `voterCode`/control numbers, `studentId`, receipt
 * codes/hashes, officer keys, password material, or per-candidate selections
 * just by passing them through. Calling `trace.getTracer(...)` directly
 * without going through this module bypasses that guarantee — don't.
 *
 * Safe to call unconditionally: when no OpenTelemetry SDK is registered (the
 * default — see instrumentation.ts), `@opentelemetry/api` falls back to a
 * no-op tracer, so this has no effect and negligible overhead in dev/CI.
 */
import { SpanStatusCode, trace, type Span } from "@opentelemetry/api";

const tracer = trace.getTracer("halal");

export type SpanAttributeValue = string | number | boolean;

/**
 * Every span attribute key this app is allowed to emit. Deliberately an
 * allowlist, not a denylist: an attribute must be added here explicitly
 * before any call site can set it. Keep this aggregate-only — election/position
 * IDs, counts, durations, cache state, and admin **role** (never email) — and
 * never anything that identifies a voter or ties a request to a ballot's
 * contents.
 */
const ALLOWED_SPAN_ATTRIBUTES: ReadonlySet<string> = new Set([
  "election.id",
  "position.id",
  "admin.role",
  "ballot.total_count",
  "ballot.valid_count",
  "ballot.invalid_count",
  "turnout.voted",
  "turnout.total",
  "recount.matches_official",
  "recount.discrepancy_count",
  "monitor.subscriber_count",
  "monitor.recompute_queued",
  "cache.hit",
  "transition.opened_count",
  "transition.closed_count",
  "transition.missed_window_count",
]);

/**
 * Throws if `key` is not on the allowlist above. Exported so tests can assert
 * the guard fires, and so `withSpan` can call it before any attribute reaches
 * a real span.
 */
export function assertAllowedSpanAttribute(key: string): void {
  if (!ALLOWED_SPAN_ATTRIBUTES.has(key)) {
    throw new Error(
      `[otel] span attribute "${key}" is not in the allowlist (lib/server/otel.ts). ` +
        "Add it there explicitly if it is genuinely aggregate-only and contains no PII.",
    );
  }
}

function setAllowedAttributes(
  span: Span,
  attributes: Record<string, SpanAttributeValue>,
): void {
  for (const [key, value] of Object.entries(attributes)) {
    assertAllowedSpanAttribute(key);
    span.setAttribute(key, value);
  }
}

/**
 * The only span handle `withSpan`'s callback ever sees. Deliberately narrower
 * than the real `Span` — it has no escape hatch to `span.setAttribute`
 * directly, so an attribute discovered partway through `fn` (e.g. a count only
 * known after a query resolves) still goes through the same allowlist check as
 * the up-front `attributes` argument. Don't widen this back to `Span`.
 */
export interface AllowedSpan {
  setAttribute(key: string, value: SpanAttributeValue): void;
}

/**
 * Runs `fn` inside a new active span named `name`, tagged with `attributes`
 * (allowlist-checked), recording success/failure status and any thrown error.
 * `fn` receives an `AllowedSpan` so any attribute it sets mid-flight is
 * allowlist-checked too.
 */
export async function withSpan<T>(
  name: string,
  attributes: Record<string, SpanAttributeValue>,
  fn: (span: AllowedSpan) => Promise<T>,
): Promise<T> {
  return tracer.startActiveSpan(name, async (span) => {
    const guardedSpan: AllowedSpan = {
      setAttribute: (key, value) => {
        assertAllowedSpanAttribute(key);
        span.setAttribute(key, value);
      },
    };
    try {
      setAllowedAttributes(span, attributes);
      const result = await fn(guardedSpan);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.recordException(error instanceof Error ? error : String(error));
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    } finally {
      span.end();
    }
  });
}
