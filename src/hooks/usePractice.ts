import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import { AudioEngine, PadSounds } from "../audio/AudioEngine";
import { classify, Onset, OnsetDetector, TemplateBank } from "../audio/dsp";
import { startMicrophone } from "../audio/microphone";
import { Microphone } from "../audio/microphone.types";
import { nearestNominal } from "../audio/timing";
import templates from "../data/templates.json";
import {
  DetectedHit,
  Kind,
  Rhythm,
  toPattern,
} from "../pandeiro-ui-base/types";
import { useClock } from "../pandeiro-ui-base/useClock";

export function usePractice(rhythm: Rhythm) {
  const [bpm, setBpm] = useState(100),
    [subdivision, setSubdivision] = useState(rhythm.subdivision);
  const [running, setRunning] = useState(false),
    [ready, setReady] = useState(false);
  const [guide, setGuide] = useState(true),
    [click, setClick] = useState(true),
    [tolerance, setTolerance] = useState(15);
  const [hits, setHits] = useState<DetectedHit[]>([]),
    [error, setError] = useState("");
  const [source, setSource] = useState<"touch" | "mic">("touch"),
    [micBusy, setMicBusy] = useState(false);
  const [latency, setLatency] = useState(0),
    [rejected, setRejected] = useState(0),
    [confidence, setConfidence] = useState<number | null>(null);
  const [calibrating, setCalibrating] = useState<Kind | null>(null),
    [profiles, setProfiles] = useState<TemplateBank>({});
  const [resetToken, setResetToken] = useState(0),
    [lastKind, setLastKind] = useState<Kind | null>(null);
  const engine = useMemo(() => new AudioEngine(), []),
    sounds = useMemo(() => new PadSounds(), []);
  const microphone = useRef<Microphone | null>(null),
    micGeneration = useRef(0);
  const settings = useRef({
    bpm,
    subdivision,
    latency,
    source,
    calibrating,
    profiles,
  });
  settings.current = {
    bpm,
    subdivision,
    latency,
    source,
    calibrating,
    profiles,
  };
  const pattern = useMemo(() => toPattern(rhythm.sequence), [rhythm.sequence]);
  const clock = useClock(
    engine.getTime,
    bpm,
    rhythm.sequence.length,
    subdivision,
  );

  const record = useCallback(
    (kind: Kind, t: number, origin: "touch" | "mic", certainty?: number) => {
      if (!engine.running || t < 0) return;
      const s = settings.current;
      const hit: DetectedHit = {
        t,
        nominal: nearestNominal(t, s.bpm, s.subdivision),
        kind,
        source: origin,
        confidence: certainty,
      };
      setHits((previous) => [...previous, hit]);
      setLastKind(kind);
    },
    [engine],
  );
  const onOnset = useRef<(onset: Onset) => void>(() => {});
  onOnset.current = (onset) => {
    const { calibrating: target, profiles: personal } = settings.current;
    if (target) {
      setProfiles((previous) => ({
        ...previous,
        [target]: [...(previous[target] || []), onset.features].slice(-8),
      }));
      setLastKind(target);
      return;
    }
    // Perfis pessoais substituem as referências apenas nos golpes calibrados.
    const result = classify(onset.features, {
      ...templates,
      ...personal,
    } as TemplateBank);
    setConfidence(result?.confidence ?? null);
    if (!result?.accepted) {
      setRejected((n) => n + 1);
      return;
    }
    const age = performance.now() / 1000 - onset.time;
    const t = engine.getTime() - age - settings.current.latency / 1000;
    record(result.kind, t, "mic", result.confidence);
  };
  const detector = useMemo(
    () => new OnsetDetector((onset) => onOnset.current(onset)),
    [],
  );
  const disableMicrophone = useCallback(async () => {
    micGeneration.current++;
    const active = microphone.current;
    microphone.current = null;
    setSource("touch");
    setMicBusy(false);
    setCalibrating(null);
    detector.reset();
    if (active) await active.stop().catch(() => {});
  }, [detector]);
  const enableMicrophone = useCallback(async () => {
    if (microphone.current || micBusy) return;
    const generation = ++micGeneration.current;
    engine.pause();
    setRunning(false);
    setMicBusy(true);
    setError("");
    try {
      const active = await startMicrophone(
        (pcm, rate, time) => detector.process(pcm, rate, time),
        () => {
          engine.pause();
          setRunning(false);
          void disableMicrophone();
          setError("A captura do microfone foi interrompida.");
        },
      );
      if (generation !== micGeneration.current) {
        await active.stop();
        return;
      }
      microphone.current = active;
      detector.reset();
      setGuide(false);
      setClick(false);
      setSource("mic");
    } catch (e) {
      const name = e instanceof Error ? e.name : "";
      setError(
        name === "NotAllowedError"
          ? "Permissão negada para o microfone. Libere o acesso no navegador ou nas configurações."
          : name === "NotFoundError"
            ? "Nenhum microfone foi encontrado neste dispositivo."
            : name === "NotReadableError"
              ? "O microfone está ocupado ou indisponível. Feche outros aplicativos de gravação."
              : e instanceof Error
                ? e.message
                : "Não foi possível abrir o microfone.",
      );
    } finally {
      if (generation === micGeneration.current) setMicBusy(false);
    }
  }, [detector, disableMicrophone, engine, micBusy]);
  const tap = useCallback(
    (kind: Kind) => {
      if (settings.current.source !== "touch") return;
      record(kind, engine.getTime(), "touch");
      setLastKind(kind);
      sounds.play(kind);
    },
    [engine, record, sounds],
  );
  const toggle = useCallback(async () => {
    if (engine.running) {
      engine.pause();
      setRunning(false);
      return;
    }
    try {
      await engine.start();
      setRunning(true);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao reproduzir áudio.");
    }
  }, [engine]);
  useEffect(() => {
    setSubdivision(rhythm.subdivision);
  }, [rhythm.id, rhythm.subdivision]);
  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setRunning(false);
    setHits([]);
    engine
      .prepare({
        pattern,
        steps: rhythm.sequence.length,
        bpm,
        subdivision,
        guide: guide && source !== "mic",
        click,
      })
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((e) => {
        if (!cancelled) setError(String(e.message || e));
      });
    return () => {
      cancelled = true;
      engine.dispose();
    };
  }, [
    engine,
    pattern,
    rhythm.sequence.length,
    bpm,
    subdivision,
    guide,
    click,
    source,
    resetToken,
  ]);
  useEffect(() => {
    sounds.prepare();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        engine.pause();
        setRunning(false);
        void disableMicrophone();
      }
    });
    return () => {
      subscription.remove();
      sounds.dispose();
      engine.dispose();
      void disableMicrophone();
    };
  }, [sounds, engine, disableMicrophone]);
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const handle = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        ["INPUT", "TEXTAREA"].includes(target?.tagName || "") ||
        target?.isContentEditable ||
        event.repeat ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      )
        return;
      const keyMap: Record<string, Kind> = {
        a: "grave",
        s: "dedos",
        d: "tapa",
        f: "punho",
        g: "abafado",
        h: "tapaPolegar",
        j: "graveDedos",
        k: "medio",
        l: "rulo",
      };
      if (keyMap[event.key.toLowerCase()]) {
        event.preventDefault();
        tap(keyMap[event.key.toLowerCase()]);
      }
      if (
        event.code === "Space" &&
        target?.getAttribute("role") !== "button" &&
        target?.tagName !== "BUTTON"
      ) {
        event.preventDefault();
        void toggle();
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [tap, toggle]);
  return {
    bpm,
    setBpm,
    subdivision,
    setSubdivision,
    running,
    ready,
    guide,
    setGuide,
    click,
    setClick,
    tolerance,
    setTolerance,
    hits,
    clock,
    pattern,
    error,
    setError,
    source,
    micBusy,
    enableMicrophone,
    disableMicrophone,
    latency,
    setLatency,
    rejected,
    confidence,
    calibrating,
    setCalibrating: (kind: Kind | null) => {
      engine.pause();
      setRunning(false);
      setCalibrating(kind);
    },
    profiles,
    clearProfiles: () => setProfiles({}),
    tap,
    toggle,
    lastKind,
    reset: () => {
      setHits([]);
      setRejected(0);
      setConfidence(null);
      setResetToken((n) => n + 1);
    },
  };
}
