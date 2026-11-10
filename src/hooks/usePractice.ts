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
  const [starting, setStarting] = useState(false);
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
  const micOpening = useRef(false),
    closingMicrophone = useRef<Promise<void>>(Promise.resolve());
  const openingMicrophone = useRef<Promise<void>>(Promise.resolve());
  const playbackRevision = useRef(0),
    startingRef = useRef(false),
    inputSince = useRef(Infinity);
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
      if (
        !engine.running ||
        !Number.isFinite(t) ||
        t < 0 ||
        origin !== settings.current.source
      )
        return;
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
    if (settings.current.source !== "mic" || onset.time < inputSince.current)
      return;
    const { calibrating: target, profiles: personal } = settings.current;
    if (target) {
      setProfiles((previous) => ({
        ...previous,
        [target]: [...(previous[target] || []), onset.features].slice(-8),
      }));
      setLastKind(target);
      return;
    }
    if (!engine.running) return;
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
    micOpening.current = false;
    inputSince.current = Infinity;
    const active = microphone.current;
    microphone.current = null;
    setSource("touch");
    setMicBusy(false);
    setCalibrating(null);
    detector.reset();
    closingMicrophone.current = closingMicrophone.current.then(async () => {
      if (active) await active.stop().catch(() => {});
    });
    await closingMicrophone.current;
  }, [detector]);
  const enableMicrophone = useCallback(async () => {
    if (microphone.current || micOpening.current) return;
    micOpening.current = true;
    const previousOpening = openingMicrophone.current;
    let finishOpening!: () => void;
    openingMicrophone.current = new Promise<void>((resolve) => {
      finishOpening = resolve;
    });
    const generation = ++micGeneration.current;
    engine.pause();
    setRunning(false);
    setMicBusy(true);
    setError("");
    try {
      await previousOpening;
      await closingMicrophone.current;
      if (generation !== micGeneration.current) return;
      const active = await startMicrophone(
        (pcm, rate, time) => {
          if (generation === micGeneration.current && microphone.current)
            detector.process(pcm, rate, time);
        },
        () => {
          if (generation !== micGeneration.current) return;
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
      inputSince.current = performance.now() / 1000;
      detector.reset();
      setGuide(false);
      setClick(false);
      setSource("mic");
    } catch (e) {
      if (generation !== micGeneration.current) return;
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
      finishOpening();
      if (generation === micGeneration.current) {
        micOpening.current = false;
        setMicBusy(false);
      }
    }
  }, [detector, disableMicrophone, engine]);
  const tap = useCallback(
    (kind: Kind) => {
      if (settings.current.source !== "touch" || micOpening.current) return;
      record(kind, engine.getTime(), "touch");
      setLastKind(kind);
      void sounds
        .play(kind)
        .catch((e) =>
          setError(
            e instanceof Error ? e.message : "Não foi possível tocar o sample.",
          ),
        );
    },
    [engine, record, sounds],
  );
  const toggle = useCallback(async () => {
    if (
      !engine.ready ||
      settings.current.calibrating ||
      micOpening.current ||
      startingRef.current
    )
      return;
    if (engine.running) {
      engine.pause();
      inputSince.current = Infinity;
      detector.reset();
      setRunning(false);
      return;
    }
    const revision = playbackRevision.current;
    startingRef.current = true;
    setStarting(true);
    try {
      const started = await engine.start();
      if (revision !== playbackRevision.current) return;
      if (started) {
        inputSince.current = performance.now() / 1000;
        detector.reset();
      }
      setRunning(started && engine.running);
      setError("");
    } catch (e) {
      if (revision !== playbackRevision.current) return;
      setError(e instanceof Error ? e.message : "Erro ao reproduzir áudio.");
    } finally {
      if (revision === playbackRevision.current) {
        startingRef.current = false;
        setStarting(false);
      }
    }
  }, [engine, detector]);
  useEffect(() => {
    setSubdivision(rhythm.subdivision);
  }, [rhythm.id, rhythm.subdivision]);
  useEffect(() => {
    let cancelled = false;
    playbackRevision.current++;
    startingRef.current = false;
    inputSince.current = Infinity;
    detector.reset();
    setStarting(false);
    setReady(false);
    setRunning(false);
    setHits([]);
    setRejected(0);
    setConfidence(null);
    setLastKind(null);
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
    detector,
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
      playbackRevision.current++;
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
        !target?.closest(
          'button, input, textarea, select, [role="button"], [role="tab"], [role="switch"], [role="checkbox"], [role="slider"]',
        )
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
    starting,
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
      inputSince.current = kind ? performance.now() / 1000 : Infinity;
      detector.reset();
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
