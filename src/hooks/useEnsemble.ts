import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";
import { AudioEngine } from "../audio/AudioEngine";
import { renderEnsemble } from "../audio/ensemble";
import { EnsembleScene, cueAt } from "../music/ensemble";
import { useClock } from "../pandeiro-ui-base/useClock";
export function useEnsemble(scene: EnsembleScene) {
  const engine = useMemo(() => new AudioEngine(), []);
  const key = JSON.stringify({ ...scene, title: "" });
  const rendered = useMemo(() => renderEnsemble(scene), [key]);
  const [ready, setReady] = useState(false),
    [running, setRunning] = useState(false),
    [busy, setBusy] = useState(false),
    [finished, setFinished] = useState(false),
    [error, setError] = useState(""),
    [reset, setReset] = useState(0);
  const revision = useRef(0),
    starting = useRef(false);
  const clock = useClock(engine.getTime, scene.bpm, 4, 1);
  useEffect(() => {
    let cancelled = false;
    revision.current++;
    starting.current = false;
    setReady(false);
    setRunning(false);
    setBusy(false);
    setFinished(false);
    setError("");
    engine
      .prepareRendered(rendered)
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((e) => {
        if (!cancelled) setError(String(e.message || e));
      });
    return () => {
      cancelled = true;
      revision.current++;
      engine.dispose();
    };
  }, [engine, rendered, reset]);
  const pause = useCallback(() => {
    revision.current++;
    starting.current = false;
    engine.pause();
    setBusy(false);
    setRunning(false);
  }, [engine]);
  useEffect(() => {
    engine.onFinish = () => {
      starting.current = false;
      setBusy(false);
      setRunning(false);
      setFinished(true);
    };
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") pause();
    });
    engine.setVolume(0.75);
    return () => {
      sub.remove();
      engine.onFinish = undefined;
    };
  }, [engine, pause]);
  const toggle = async () => {
    if (!ready || starting.current) return;
    if (engine.running) {
      pause();
      return;
    }
    const token = revision.current;
    starting.current = true;
    setBusy(true);
    try {
      if (engine.finished) await engine.prepareRendered(rendered);
      if (token !== revision.current) return;
      setFinished(false);
      const started = await engine.start();
      if (token === revision.current) {
        setRunning(started);
        setError("");
      }
    } catch (e) {
      if (token === revision.current)
        setError(e instanceof Error ? e.message : "Não foi possível iniciar.");
    } finally {
      if (token === revision.current) {
        starting.current = false;
        setBusy(false);
      }
    }
  };
  const time = clock.t;
  return {
    ready,
    running,
    busy,
    finished,
    error,
    rendered,
    time,
    beat: Math.max(0, (time * scene.bpm) / 60),
    cue: cueAt(rendered.cues, (time * scene.bpm) / 60),
    toggle,
    pause,
    restart: () => {
      pause();
      setReset((n) => n + 1);
    },
  };
}
