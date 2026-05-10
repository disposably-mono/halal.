"use client";

import { useEffect, useState } from "react";

export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

export function useCountdown(target: string | null): Countdown {
  const [timeLeft, setTimeLeft] = useState<Countdown>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false,
  });

  useEffect(() => {
    if (!target) return;
    const targetDate = new Date(target).getTime();

    const tick = () => {
      const now = Date.now();
      const diff = targetDate - now;
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
        expired: false,
      });
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  return timeLeft;
}
