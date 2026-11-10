import { useEffect, useState } from "react";
import { clockPosition } from "../audio/timing";

/** O RAF apenas pede a atualização. O tempo vem do player de áudio. */
export function useClock(
  readAudioTime: () => number,
  bpm: number,
  steps = 16,
  subdivision = 4,
) {
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      setT(readAudioTime());
      raf = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(raf);
  }, [readAudioTime]);
  return clockPosition(t, bpm, steps, subdivision);
}
