import React, { useEffect, useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import appPackage from "./package.json";
import {
  CODES,
  Kind,
  Rhythm,
  STROKES,
  StrokeCode,
  THEME as T,
} from "./src/pandeiro-ui-base/types";
import { HitBars } from "./src/pandeiro-ui-base/HitBars";
import { RhythmRing } from "./src/pandeiro-ui-base/RhythmRing";
import { TimingScatter } from "./src/pandeiro-ui-base/TimingScatter";
import { usePractice } from "./src/hooks/usePractice";
import { useJournal } from "./src/hooks/useJournal";
import { sessionMetrics } from "./src/audio/timing";
import { PLAYBACK_RATE } from "./src/audio/sampleLibrary";
import { diagnoseHits, makeRecord, SessionExport } from "./src/study/records";
import { SUBDIVISION_NAMES, scorePosition } from "./src/music/score";
import { Pandeiro } from "./src/components/Pandeiro";
import { RHYTHMS, RhythmLibrary } from "./src/components/RhythmLibrary";
import { ScoreStrip } from "./src/components/ScoreStrip";
import { SoundAtlas } from "./src/components/SoundAtlas";
import {
  ExerciseLibrary,
  INITIAL_DRAFT,
  EditorDraft,
} from "./src/components/ExerciseLibrary";
import { StudyJournal } from "./src/components/StudyJournal";
import { PracticeControls, Transport } from "./src/components/PracticeControls";
import { Button, Label, Separator, fonts } from "./src/components/ui";

const MODES = [
  { id: "ring", number: "01", name: "Roda do tempo" },
  { id: "bars", number: "02", name: "Barras no tempo" },
  { id: "scatter", number: "03", name: "Precisão" },
] as const;
type Section = "practice" | "studies" | "sounds" | "journal";
const SECTIONS: { id: Section; name: string }[] = [
  { id: "practice", name: "Prática" },
  { id: "studies", name: "Estudos e escrita" },
  { id: "sounds", name: "Articulações e sons" },
  { id: "journal", name: "Caderno" },
];

export default function App() {
  const [loaded, fontError] = useFonts({
    InterTight_900Black: require("@expo-google-fonts/inter-tight/900Black/InterTight_900Black.ttf"),
    InterTight_500Medium: require("@expo-google-fonts/inter-tight/500Medium/InterTight_500Medium.ttf"),
    JetBrainsMono_500Medium: require("@expo-google-fonts/jetbrains-mono/500Medium/JetBrainsMono_500Medium.ttf"),
    CormorantGaramond_600SemiBold: require("@expo-google-fonts/cormorant-garamond/600SemiBold/CormorantGaramond_600SemiBold.ttf"),
  });
  if (!loaded && !fontError)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: T.black,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: T.ivory }}>PANDEIRO.APP · Estudos</Text>
      </View>
    );
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Laboratory />
    </SafeAreaProvider>
  );
}
function Laboratory() {
  const [rhythm, setRhythm] = useState(RHYTHMS.find((r) => r.id === "lw77")!);
  const [section, setSection] = useState<Section>("practice"),
    [modeIndex, setModeIndex] = useState(0),
    [library, setLibrary] = useState(false),
    [selectedUnit, setSelectedUnit] = useState(0);
  const [draft, setDraft] = useState<EditorDraft>(INITIAL_DRAFT),
    [notes, setNotes] = useState(""),
    [savedMessage, setSavedMessage] = useState("");
  const practice = usePractice(rhythm, section === "practice" && !library),
    journal = useJournal();
  const { width } = useWindowDimensions(),
    wide = width >= 1000;
  const contentWidth = Math.max(
    220,
    Math.min(width, 1360) - 44 - (wide ? 328 : 0) - 36,
  );
  const chartWidth = Math.min(710, contentWidth);
  const ringSize = Math.min(360, chartWidth),
    mode = MODES[modeIndex];
  const { clock, pattern, hits, sequence, subdivision, bpm, range } = practice;
  const focused = Math.min(selectedUnit, rhythm.sequence.length - 1),
    focusedCode = rhythm.sequence[focused] as StrokeCode | ".";
  const evaluatedTime =
    Math.floor(clock.t / clock.stepDur + 1e-9) * clock.stepDur;
  const metrics = useMemo(
    () =>
      sessionMetrics(
        hits,
        pattern,
        sequence.length,
        bpm,
        subdivision,
        practice.tolerance,
        evaluatedTime,
      ),
    [
      hits,
      pattern,
      sequence.length,
      bpm,
      subdivision,
      practice.tolerance,
      evaluatedTime,
    ],
  );
  const diagnosis = useMemo(
    () =>
      diagnoseHits(
        hits,
        pattern,
        sequence.length,
        bpm,
        subdivision,
        practice.tolerance,
        evaluatedTime,
      ),
    [
      hits,
      pattern,
      sequence.length,
      bpm,
      subdivision,
      practice.tolerance,
      evaluatedTime,
    ],
  );
  useEffect(() => {
    setSelectedUnit(0);
  }, [rhythm.id]);
  useEffect(() => {
    setSavedMessage("");
  }, [practice.takeIdentity.id]);
  const navigate = (next: Section) => {
    if (next === section) return;
    practice.setCalibrating(null);
    setSection(next);
  };
  const openLibrary = () => {
    practice.pause();
    setLibrary(true);
  };
  const chooseRhythm = (next: Rhythm) => {
    practice.pause();
    practice.setIsolation(null);
    setRhythm(next);
    setSection("practice");
  };
  const snapshot = (): SessionExport => {
    const record = makeRecord(
      rhythm,
      {
        bpm,
        subdivision,
        tolerance: practice.tolerance,
        range,
        groups: practice.groups,
        source: practice.source,
        captureRate: practice.captureRate,
        clickMode: practice.clickMode,
        dynamic: practice.dynamic,
        sampleChoices: practice.sampleChoices,
        isolation: practice.isolation,
        volume: practice.volume,
        guide: practice.guide,
        click: practice.click,
        latencyMs: practice.latency,
      },
      pattern,
      hits,
      practice.readTime(),
      notes,
      practice.takeIdentity,
    );
    return {
      schemaVersion: 1,
      appVersion: appPackage.version,
      timingUnit: "seconds",
      errorUnit: "milliseconds",
      timestampMeaning: `t e nominal no relógio da reprodução; t do microfone desconta ${practice.latency} ms. Associação à unidade mais próxima; escore de timbre não é probabilidade. Buffer de referência ${PLAYBACK_RATE} Hz; templates 16000 Hz; captura ${practice.captureRate ?? "não informada"} Hz. Configuração final da tomada; volume pode ter variado.`,
      rhythm,
      record,
      hits: [...hits],
    };
  };
  const saveTake = async () => {
    practice.pause();
    try {
      if (!hits.length) return;
      await journal.add(snapshot().record);
      setSavedMessage(
        "Resumo da tomada registrado. Exporte JSON/CSV para preservar os golpes individuais.",
      );
    } catch (error) {
      practice.setError(
        error instanceof Error
          ? error.message
          : "Não foi possível registrar a tomada.",
      );
    }
  };
  const currentKind = pattern[clock.step],
    pulse =
      practice.running && currentKind
        ? Math.exp(
            -(clock.t - clock.barStart - clock.step * clock.stepDur) * 22,
          )
        : 0;
  const quarterSpan = (sequence.length / subdivision).toLocaleString("pt-BR", {
    maximumFractionDigits: 3,
  });
  const reinterpreted =
    subdivision !== rhythm.subdivision ||
    range.start !== 0 ||
    range.end !== rhythm.sequence.length;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.black }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.page}
      >
        <View style={styles.header}>
          <View style={styles.inline}>
            <Pandeiro size={30} />
            <Text style={styles.brand}>
              PANDEIRO<Text style={{ color: T.orange }}>.APP</Text>
            </Text>
            <Label>ESTUDOS</Label>
          </View>
          <Label>
            {wide
              ? "ESCUTA · LEITURA · ANÁLISE TEMPORAL"
              : `v${appPackage.version}`}
          </Label>
        </View>
        <View style={{ gap: 8 }}>
          <Label orange>LABORATÓRIO DE PRÁTICA MUSICAL</Label>
          <Text
            testID="study-heading"
            accessibilityRole="header"
            style={[styles.title, { fontSize: wide ? 46 : 35 }]}
          >
            Estudo do pandeiro.
          </Text>
          <Text style={styles.subtitle}>
            Organizar a escuta, tornar a escrita explícita e documentar a
            execução.
          </Text>
        </View>
        <View style={styles.navigation}>
          {SECTIONS.map((item, index) => (
            <Pressable
              key={item.id}
              accessibilityRole="tab"
              accessibilityLabel={item.name}
              accessibilityState={{ selected: section === item.id }}
              {...(Platform.OS === "web"
                ? { "aria-selected": section === item.id }
                : {})}
              onPress={() => navigate(item.id)}
              {...tabKeys(index, SECTIONS.length, (next) =>
                navigate(SECTIONS[next].id),
              )}
              style={[
                styles.navTab,
                section === item.id && { borderBottomColor: T.orange },
              ]}
            >
              <Text
                style={{
                  color: section === item.id ? T.ivory : T.muted,
                  fontFamily: fonts.text,
                  fontSize: wide ? 15 : 12,
                }}
              >
                {item.name}
              </Text>
            </Pressable>
          ))}
        </View>
        {!!practice.error && (
          <View accessibilityRole="alert" style={styles.notice}>
            <Text style={[styles.body, { flex: 1, color: T.ivory }]}>
              {practice.error}
            </Text>
            <Button label="Fechar aviso" onPress={() => practice.setError("")}>
              ✕
            </Button>
          </View>
        )}
        {practice.source === "mic" && section !== "practice" && (
          <View style={styles.notice}>
            <Text style={[styles.body, { flex: 1 }]}>
              Captura ainda ativa. A tomada está pausada.
            </Text>
            <Button onPress={() => void practice.disableMicrophone()}>
              Encerrar captura
            </Button>
          </View>
        )}
        {section === "practice" && (
          <>
            <View
              style={[
                styles.studyHeading,
                !wide && { flexDirection: "column", alignItems: "stretch" },
              ]}
            >
              <View style={{ flex: wide ? 1 : undefined, gap: 7 }}>
                <Label>
                  {rhythm.origin === "study"
                    ? "ESTUDO ORIGINAL DO PROJETO"
                    : rhythm.origin === "custom"
                      ? "ESCRITA PESSOAL"
                      : `${rhythm.group.toUpperCase()} · BIBLIOTECA`}
                </Label>
                <Text style={styles.studyTitle}>{rhythm.name}</Text>
                <Text style={styles.body}>
                  {rhythm.objective ?? rhythm.description}
                </Text>
              </View>
              {!wide && (
                <Button
                  label="Abrir biblioteca de ritmos"
                  style={{ alignSelf: "flex-start" }}
                  onPress={openLibrary}
                >
                  Biblioteca ↗
                </Button>
              )}
            </View>
            {!wide && (
              <View style={styles.card}>
                <Transport practice={practice} compact />
              </View>
            )}
            <View
              style={{
                flexDirection: wide ? "row" : "column",
                gap: 22,
                alignItems: "stretch",
              }}
            >
              <View
                style={{ flex: wide ? 1 : undefined, minWidth: 0, gap: 18 }}
              >
                <View style={styles.card}>
                  <View style={styles.between}>
                    <Label>ESCRITA E POSIÇÃO NO CICLO</Label>
                    <Label orange>
                      {rhythm.meter && !reinterpreted
                        ? `COMPASSO ${rhythm.meter}`
                        : "CICLO DE ESTUDO"}
                    </Label>
                  </View>
                  <ScoreStrip
                    rhythm={rhythm}
                    subdivision={subdivision}
                    width={contentWidth}
                    current={practice.running ? range.start + clock.step : null}
                    selected={focused}
                    range={range}
                    isolation={practice.isolation}
                    onSelect={setSelectedUnit}
                  />
                  <Separator />
                  <View style={styles.between}>
                    <Label>
                      UNIDADE {String(focused + 1).padStart(2, "0")} ·{" "}
                      {focusedCode === "."
                        ? "PAUSA"
                        : STROKES[focusedCode].name.toUpperCase()}
                    </Label>
                    <Label>POS. ♩ {scorePosition(focused, subdivision)}</Label>
                  </View>
                  <View style={[styles.inline, { flexWrap: "wrap" }]}>
                    <Button
                      disabled={
                        focusedCode === "." ||
                        practice.source === "mic" ||
                        practice.micBusy
                      }
                      label="Ouvir unidade selecionada"
                      onPress={() =>
                        focusedCode !== "." &&
                        void practice.audition(STROKES[focusedCode].kind)
                      }
                    >
                      ▶ Ouvir posição
                    </Button>
                    <Button
                      onPress={() =>
                        practice.setRange(
                          focused,
                          Math.max(focused + 1, range.end),
                        )
                      }
                    >
                      Definir início
                    </Button>
                    <Button
                      disabled={focused < range.start}
                      onPress={() =>
                        practice.setRange(range.start, focused + 1)
                      }
                    >
                      Definir fim
                    </Button>
                    <Button
                      onPress={() =>
                        practice.setRange(0, rhythm.sequence.length)
                      }
                    >
                      Ciclo completo
                    </Button>
                  </View>
                  <Text style={styles.caption}>
                    Recorte {range.start + 1}–{range.end} de{" "}
                    {rhythm.sequence.length} · {SUBDIVISION_NAMES[subdivision]}{" "}
                    · {quarterSpan} semínimas/ciclo
                    {reinterpreted ? " · recorte ou grade reinterpretada" : ""}.
                  </Text>
                </View>
                <View style={styles.card}>
                  <View style={styles.modeTabs}>
                    {MODES.map((tab, index) => (
                      <Pressable
                        key={tab.id}
                        accessibilityRole="tab"
                        accessibilityLabel={tab.name}
                        accessibilityState={{ selected: index === modeIndex }}
                        {...(Platform.OS === "web"
                          ? { "aria-selected": index === modeIndex }
                          : {})}
                        onPress={() => setModeIndex(index)}
                        {...tabKeys(index, MODES.length, setModeIndex)}
                        style={[
                          styles.modeTab,
                          index === modeIndex && {
                            borderBottomColor: T.orange,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color: index === modeIndex ? T.ivory : T.muted,
                            fontFamily: fonts.text,
                            fontSize: 12,
                          }}
                        >
                          {tab.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <View style={styles.between}>
                    <Label>
                      {mode.number} / {mode.name.toUpperCase()}
                    </Label>
                    <Label orange>
                      {practice.running ? "● EM CURSO" : "○ EM PAUSA"}
                    </Label>
                  </View>
                  <View
                    style={{
                      minHeight: ringSize + 12,
                      paddingVertical: 8,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {mode.id === "ring" && (
                      <RhythmRing
                        pattern={pattern}
                        phase={clock.phase}
                        bpm={bpm}
                        steps={sequence.length}
                        subdivision={subdivision}
                        size={ringSize}
                        pulse={pulse}
                        running={practice.running}
                      >
                        <View style={styles.ringCenter}>
                          <Pandeiro size={76} />
                          <Text
                            style={{
                              color: T.ivory,
                              fontFamily: fonts.text,
                              fontSize: 30,
                            }}
                          >
                            {String(clock.step + 1).padStart(2, "0")}
                            <Text style={{ color: T.muted, fontSize: 13 }}>
                              {" "}
                              / {sequence.length}
                            </Text>
                          </Text>
                          <Label>
                            {currentKind
                              ? CODES.find(
                                  (c) => STROKES[c].kind === currentKind,
                                )
                              : "PAUSA"}
                          </Label>
                        </View>
                      </RhythmRing>
                    )}
                    {mode.id === "bars" && (
                      <HitBars
                        pattern={pattern}
                        hits={hits}
                        now={clock.t}
                        phase={clock.phase}
                        barStart={clock.barStart}
                        barDur={clock.bar}
                        steps={sequence.length}
                        subdivision={subdivision}
                        toleranceMs={practice.tolerance}
                        width={chartWidth}
                        height={270}
                      />
                    )}
                    {mode.id === "scatter" && (
                      <TimingScatter
                        hits={hits}
                        now={clock.t}
                        bpm={bpm}
                        toleranceMs={practice.tolerance}
                        width={chartWidth}
                        height={245}
                        rangeMs={Math.max(
                          100,
                          Math.ceil(30000 / bpm / subdivision / 50) * 50,
                        )}
                      />
                    )}
                  </View>
                  <View style={styles.between}>
                    <Label>
                      {mode.id === "scatter"
                        ? "ADIANTADO ←"
                        : `${sequence.length} UNIDADES · ${practice.groups.join("+")}`}
                    </Label>
                    <Label orange>
                      {mode.id === "scatter"
                        ? "→ ATRASADO"
                        : `${clock.bar.toFixed(2)} s / CICLO`}
                    </Label>
                  </View>
                  {mode.id === "scatter" && (
                    <Text style={styles.caption}>
                      Eixo horizontal: erro em ms. Eixo vertical: idade do golpe
                      nos últimos 4 s. Semínima = {bpm} BPM; janela ±
                      {practice.tolerance} ms.
                    </Text>
                  )}
                  {mode.id === "bars" && (
                    <Text style={styles.caption}>
                      Contorno: articulação esperada. Branco: golpe no intervalo
                      de tolerância. ×: articulação diferente. A altura da barra
                      é uma categoria sonora, sem equivalência a Hz.
                    </Text>
                  )}
                  {practice.isolation && (
                    <Text style={[styles.caption, { color: T.orange }]}>
                      Redução ativa:{" "}
                      {
                        STROKES[
                          CODES.find(
                            (c) => STROKES[c].kind === practice.isolation,
                          )!
                        ].name
                      }
                      . A avaliação considera somente essa articulação no
                      recorte.
                    </Text>
                  )}
                </View>
                <View style={styles.stats}>
                  <Metric
                    name="ACERTOS NA GRADE"
                    value={
                      metrics.expected
                        ? `${metrics.correct}/${metrics.expected}`
                        : "—"
                    }
                    detail={
                      metrics.expected
                        ? `${metrics.accuracy}% das posições concluídas`
                        : "Comece a tocar"
                    }
                  />
                  <Metric
                    name="ERRO MÉDIO ABS."
                    value={metrics.count ? metrics.mae.toFixed(1) : "—"}
                    detail={
                      metrics.count
                        ? `ms · σ ${metrics.std.toFixed(1)} ms`
                        : "Nenhum golpe registrado"
                    }
                  />
                  <Metric
                    name="GOLPES TOCADOS"
                    value={String(hits.length).padStart(2, "0")}
                    detail={
                      metrics.count
                        ? `viés ${metrics.mean >= 0 ? "+" : ""}${metrics.mean.toFixed(1)} ms`
                        : "Aguardando entrada"
                    }
                  />
                </View>
                <View style={styles.card}>
                  <Label>LEITURA DO RESULTADO</Label>
                  <Text style={styles.body}>
                    Unidades sem golpe: {diagnosis.missing} · articulação
                    divergente: {diagnosis.wrongKind} · fora da janela:{" "}
                    {diagnosis.late} · em pausas: {diagnosis.unexpected} ·
                    repetições: {diagnosis.duplicates}.
                  </Text>
                  <Text style={styles.caption}>
                    As categorias podem se sobrepor. Acertos exigem articulação
                    e tempo; métricas temporais incluem todos os golpes
                    registrados. A associação usa a unidade mais próxima: mede
                    ajuste local à grade e não reconhece deslocamentos de frase,
                    qualidade do timbre ou intensidade.
                  </Text>
                  <View style={[styles.inline, { flexWrap: "wrap" }]}>
                    <Button
                      primary
                      disabled={!hits.length || !journal.loaded}
                      onPress={() => void saveTake()}
                    >
                      Registrar tomada
                    </Button>
                    <Button onPress={() => navigate("journal")}>
                      Observações e exportação →
                    </Button>
                  </View>
                  {!!savedMessage && (
                    <Text
                      accessibilityLiveRegion="polite"
                      style={{ ...styles.caption, color: T.orange }}
                    >
                      {savedMessage}
                    </Text>
                  )}
                </View>
                <Pads practice={practice} />
              </View>
              <PracticeControls
                practice={practice}
                rhythm={rhythm}
                wide={wide}
                openLibrary={openLibrary}
              />
            </View>
          </>
        )}
        {section === "studies" && (
          <ExerciseLibrary
            onChoose={chooseRhythm}
            draft={draft}
            setDraft={setDraft}
          />
        )}
        {section === "sounds" && <SoundAtlas practice={practice} />}
        {section === "journal" && (
          <StudyJournal
            journal={journal}
            notes={notes}
            setNotes={setNotes}
            session={snapshot}
            onSave={() => void saveTake()}
            savedMessage={savedMessage}
            exportError={practice.setError}
          />
        )}
        <View
          style={[
            styles.between,
            {
              borderTopWidth: 1,
              borderTopColor: T.line,
              paddingTop: 22,
              paddingBottom: 12,
            },
          ]}
        >
          <Label>ESTUDO · ESCUTA · DOCUMENTAÇÃO</Label>
          <Label>PANDEIRO.APP / LAB · v{appPackage.version}</Label>
        </View>
      </ScrollView>
      <RhythmLibrary
        open={library}
        selected={rhythm.id}
        onSelect={chooseRhythm}
        onClose={() => setLibrary(false)}
      />
    </SafeAreaView>
  );
}
function Pads({ practice }: { practice: ReturnType<typeof usePractice> }) {
  const groups: { name: string; codes: StrokeCode[] }[] = [
    { name: "MEMBRANA / GRAVES", codes: ["P", "A", "Q"] },
    { name: "CONDUÇÃO", codes: ["D", "B", "M"] },
    { name: "ATAQUES / TEXTURAS", codes: ["T", "X", "R"] },
  ];
  return (
    <View style={{ gap: 14 }}>
      <Label>ENTRADA MANUAL · NOVE ARTICULAÇÕES</Label>
      {groups.map((group) => (
        <View key={group.name} style={{ gap: 7 }}>
          <Label>{group.name}</Label>
          <View style={styles.inline}>
            {group.codes.map((code) => (
              <Pressable
                key={code}
                accessibilityRole="button"
                accessibilityLabel={`Tocar ${STROKES[code].name}`}
                disabled={practice.source === "mic" || practice.micBusy}
                {...(Platform.OS === "web" ? { delayPressIn: 0 } : {})}
                onPressIn={() => practice.tap(STROKES[code].kind)}
                style={({ pressed }) => [
                  styles.pad,
                  {
                    backgroundColor: pressed ? T.orange : T.panel,
                    opacity:
                      practice.source === "mic" || practice.micBusy ? 0.4 : 1,
                  },
                ]}
              >
                {({ pressed }) => (
                  <>
                    <View style={styles.between}>
                      <Text
                        style={{
                          color: pressed ? T.black : T.ivory,
                          fontFamily: fonts.text,
                          fontSize: 23,
                        }}
                      >
                        {code}
                      </Text>
                      {Platform.OS === "web" && (
                        <Text
                          style={{
                            color: pressed ? T.black : T.muted,
                            fontFamily: fonts.mono,
                            fontSize: 10,
                          }}
                        >
                          {STROKES[code].key.toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <Text
                      style={{
                        color: pressed ? T.black : T.ivory,
                        fontFamily: fonts.text,
                        fontSize: 12,
                      }}
                    >
                      {STROKES[code].name}
                    </Text>
                  </>
                )}
              </Pressable>
            ))}
          </View>
        </View>
      ))}
      <Text style={styles.caption}>
        {practice.source === "mic"
          ? "Os pads ficam desativados durante a captura."
          : "Teclado: A grave · S dedos · D tapa · F base da mão. G/H/J/K/L: articulações adicionais. Espaço inicia/pausa fora dos controles."}
      </Text>
    </View>
  );
}
function Metric({
  name,
  value,
  detail,
}: {
  name: string;
  value: string;
  detail: string;
}) {
  return (
    <View style={{ flex: 1, minWidth: 0, gap: 8, padding: 12 }}>
      <Label>{name}</Label>
      <Text style={{ color: T.ivory, fontFamily: fonts.text, fontSize: 27 }}>
        {value}
      </Text>
      <Text style={{ ...styles.caption, fontSize: 10 }}>{detail}</Text>
    </View>
  );
}
function tabKeys(
  index: number,
  length: number,
  change: (index: number) => void,
) {
  return Platform.OS === "web"
    ? {
        onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
          let next = index;
          if (event.key === "ArrowRight") next = (index + 1) % length;
          else if (event.key === "ArrowLeft")
            next = (index + length - 1) % length;
          else if (event.key === "Home") next = 0;
          else if (event.key === "End") next = length - 1;
          else if (event.key !== " ") return;
          event.preventDefault();
          event.stopPropagation();
          change(next);
          const tabs =
            event.currentTarget.parentElement?.querySelectorAll<HTMLElement>(
              '[role="tab"]',
            );
          tabs?.[next]?.focus();
        },
      }
    : {};
}
const styles = StyleSheet.create({
  page: {
    width: "100%",
    maxWidth: 1360,
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 24,
    gap: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: T.line,
    paddingBottom: 18,
    gap: 10,
  },
  brand: {
    fontFamily: fonts.title,
    fontSize: 18,
    color: T.ivory,
    letterSpacing: -0.5,
  },
  title: { color: T.ivory, fontFamily: fonts.serif, letterSpacing: -0.5 },
  subtitle: {
    color: T.muted,
    fontFamily: fonts.text,
    fontSize: 15,
    lineHeight: 23,
  },
  navigation: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: T.line,
  },
  navTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
    padding: 9,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  inline: { flexDirection: "row", alignItems: "center", gap: 9 },
  between: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
  },
  studyHeading: { flexDirection: "row", alignItems: "center", gap: 16 },
  studyTitle: { color: T.ivory, fontFamily: fonts.serif, fontSize: 31 },
  card: {
    padding: 17,
    borderWidth: 1,
    borderColor: T.line,
    borderRadius: 6,
    backgroundColor: T.panel,
    gap: 15,
  },
  modeTabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: T.line,
    marginBottom: 4,
  },
  modeTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    minHeight: 46,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  ringCenter: {
    alignItems: "center",
    gap: 4,
    borderRadius: 70,
    padding: 9,
    backgroundColor: T.panel,
  },
  stats: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: T.line,
    borderRadius: 6,
  },
  pad: {
    flex: 1,
    minWidth: 0,
    minHeight: 92,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: T.line,
    borderRadius: 5,
  },
  body: {
    color: T.muted,
    fontFamily: fonts.text,
    fontSize: 14,
    lineHeight: 22,
  },
  caption: {
    color: T.muted,
    fontFamily: fonts.text,
    fontSize: 12,
    lineHeight: 19,
  },
  notice: {
    padding: 14,
    borderWidth: 1,
    borderColor: T.orange,
    backgroundColor: "#22170F",
    borderRadius: 5,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
});
