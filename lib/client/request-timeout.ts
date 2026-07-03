export const CLIENT_REQUEST_TIMEOUT_MS = 15_000;
export const CLIENT_REQUEST_TIMEOUT_MESSAGE = "Request timed out. Try again.";

export function createTimeoutController(timeoutMs: number = CLIENT_REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return {
    controller,
    clearTimeout: () => clearTimeout(timeoutId),
  };
}

export async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMessage: string = CLIENT_REQUEST_TIMEOUT_MESSAGE,
  timeoutMs: number = CLIENT_REQUEST_TIMEOUT_MS,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });

  try {
    return await Promise.race([operation, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
