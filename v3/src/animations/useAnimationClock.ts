import { useEffect, useState } from 'react';

export function useAnimationClock(active: boolean): number {
  const [timeMs, setTimeMs] = useState(0);

  useEffect(() => {
    if (!active) {
      setTimeMs(0);
      return;
    }

    let frameId = 0;
    const startedAt = performance.now();

    const tick = (now: number) => {
      setTimeMs(now - startedAt);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, [active]);

  return timeMs;
}
