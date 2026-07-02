"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;

    setIsPending(true);
    try {
      const formData = new FormData(event.currentTarget);
      const nextState = await action(state, formData);
      setState(nextState);
      if (options.shouldRefresh?.(nextState)) {
        router.refresh();
      }
    } finally {
      setIsPending(false);
    }
  }

  return { state, isPending, handleSubmit };
}
