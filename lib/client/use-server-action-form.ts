"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CLIENT_REQUEST_TIMEOUT_MESSAGE, withTimeout } from "./request-timeout";

type ServerAction<State> = (
  previousState: State,
  formData: FormData,
) => Promise<State>;

export function useServerActionForm<State>(
  action: ServerAction<State>,
  initialState: State,
  options: { shouldRefresh?: (state: State) => boolean } = {},
) {
  const router = useRouter();
  const [state, setState] = useState<State>(initialState);
  const [isPending, setIsPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submitIdRef = useRef(0);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;

    setIsPending(true);
    setSubmitError(null);
    const submitId = ++submitIdRef.current;
    try {
      const formData = new FormData(event.currentTarget);
      const nextState = await withTimeout(
        action(state, formData),
        CLIENT_REQUEST_TIMEOUT_MESSAGE,
      );
      if (submitId !== submitIdRef.current) return;
      setState(nextState);
      if (options.shouldRefresh?.(nextState)) {
        router.refresh();
      }
    } catch (error) {
      if (submitId !== submitIdRef.current) return;
      // Server actions normally report failure through the typed State (e.g.
      // { success: false, error }), handled above. An unexpected throw (a bug,
      // a rethrown non-P2002 Prisma error, a network drop) must never vanish
      // silently — surface it so the user isn't left staring at a reset
      // spinner with no explanation.
      setSubmitError(
        error instanceof Error ? error.message : "Something went wrong. Please try again.",
      );
    } finally {
      if (submitId === submitIdRef.current) {
        setIsPending(false);
      }
    }
  }

  return { state, isPending, submitError, handleSubmit };
}
