import React, { useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { CODES, STROKES, THEME as T } from "./src/pandeiro-ui-base/types";
import { HitBars } from "./src/pandeiro-ui-base/HitBars";
import { RhythmRing } from "./src/pandeiro-ui-base/RhythmRing";
import { TimingScatter } from "./src/pandeiro-ui-base/TimingScatter";
import { usePractice } from "./src/hooks/usePractice";
import { sessionMetrics } from "./src/audio/timing";
import { Pandeiro } from "./src/components/Pandeiro";
import { RHYTHMS, RhythmLibrary } from "./src/components/RhythmLibrary";
import { Button, fonts, Label, Separator } from "./src/components/ui";

const MODES = [
  {
    id: "ring",
    number: "01",
    name: "Roda do tempo",
    title: "Sinta o tempo",
    subtitle: "Veja cada golpe encontrar o seu lugar no ciclo.",
  },
  {
    id: "bars",
    number: "02",
    name: "Barras no tempo",
    title: "Dê forma ao ritmo",
    subtitle: "O contorno é o caminho. O preenchimento é a sua mão.",
  },
  {
    id: "scatter",
    number: "03",
    name: "Precisão",
    title: "Encontre o centro",
    subtitle: "Cada golpe deixa uma marca. O centro é o tempo perfeito.",
  },
] as const;

export default function App() {
  const [loaded, fontError] = useFonts({
    InterTight_900Black: require("@expo-google-fonts/inter-tight/900Black/InterTight_900Black.ttf"),
    InterTight_500Medium: require("@expo-google-fonts/inter-tight/500Medium/InterTight_500Medium.ttf"),
    JetBrainsMono_500Medium: require("@expo-google-fonts/jetbrains-mono/500Medium/JetBrainsMono_500Medium.ttf"),
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
        <Text style={{ color: T.orange }}>PANDEIRO.APP</Text>
      </View>
    );
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <PracticeScreen />
    </SafeAreaProvider>
  );
}
function PracticeScreen() {
  const [rhythm, setRhythm] = useState(RHYTHMS.find((r) => r.id === "lw77")!);
  const [modeIndex, setModeIndex] = useState(0),
    [library, setLibrary] = useState(false),
    [extended, setExtended] = useState(false),
    [details, setDetails] = useState(false);
  const practice = usePractice(rhythm),
    { width } = useWindowDimensions(),
    wide = width >= 1000;
  const mode = MODES[modeIndex],
    { clock, hits, pattern, bpm, subdivision } = practice;
  const chartWidth = wide
    ? Math.min(690, width - 480)
    : Math.max(200, Math.min(650, width - 76));
  const ringSize = Math.min(wide ? 445 : 390, chartWidth);
  const metrics = useMemo(
    () =>
      sessionMetrics(
        hits,
        pattern,
        rhythm.sequence.length,
        bpm,
        subdivision,
        practice.tolerance,
        clock.t,
      ),
    [
      hits,
      pattern,
      rhythm.sequence.length,
      bpm,
      subdivision,
      practice.tolerance,
      clock.t,
    ],
  );
  const visibleCodes = extended
    ? CODES
    : CODES.filter(
        (code) =>
          ["P", "D", "T", "B"].includes(code) || rhythm.sequence.includes(code),
      );
  const current = pattern[clock.step],
    pulse =
      practice.running && current
        ? Math.exp(
            -(clock.t - clock.barStart - clock.step * clock.stepDur) * 22,
          )
        : 0;

  const settings = (
    <View style={[styles.settings, wide && { width: 306 }]}>
      <Label orange>{wide ? "SEU TREINO" : "AJUSTES DO TREINO"}</Label>
      {wide && (
        <>
          <View style={{ gap: 7 }}>
            <Text style={styles.rhythmName}>{rhythm.name}</Text>
            <Label>
              {rhythm.sequence.length} PASSOS · {rhythm.group.toUpperCase()}
            </Label>
          </View>
          <Button
            onPress={() => setLibrary(true)}
            label="Abrir biblioteca de ritmos"
          >
            Biblioteca de ritmos ↗
          </Button>
          <Separator />
          <Transport practice={practice} />
          <Separator />
        </>
      )}
      <Toggle
        label="Ouvir o pandeiro"
        value={practice.guide && practice.source !== "mic"}
        disabled={practice.source === "mic"}
        onChange={practice.setGuide}
      />
      <Toggle
        label="Metrônomo"
        value={practice.click}
        onChange={practice.setClick}
      />
      <View style={{ gap: 9 }}>
        <Label>TOLERÂNCIA DE TEMPO</Label>
        <View style={styles.row}>
          {[15, 25, 40].map((ms) => (
            <Button
              key={ms}
              active={practice.tolerance === ms}
              style={{ flex: 1 }}
              onPress={() => practice.setTolerance(ms)}
            >
              ±{ms} ms
            </Button>
          ))}
        </View>
      </View>
      <Separator />
      <View style={{ gap: 10 }}>
        <Label>ENTRADA DOS GOLPES</Label>
        <View style={styles.row}>
          <Button
            active={practice.source === "touch"}
            style={{ flex: 1 }}
            onPress={() => void practice.disableMicrophone()}
          >
            Toque
          </Button>
          <Button
            active={practice.source === "mic"}
            disabled={practice.micBusy}
            style={{ flex: 1 }}
            onPress={() => void practice.enableMicrophone()}
          >
            {practice.micBusy ? "Abrindo…" : "Microfone"}
          </Button>
        </View>
        <Text style={styles.hint}>
          {practice.source === "mic"
            ? "● Microfone ligado · reconhecimento experimental. Use fones para o clique não virar um golpe."
            : "Toque nos pads abaixo. Inicie o treino para medir seu tempo."}
        </Text>
      </View>
      {practice.source === "mic" && (
        <View style={{ gap: 12 }}>
          <Text style={styles.hint}>
            Calibre cada golpe com 3 ataques isolados. A calibração pausa o
            treino.
          </Text>
          <View style={[styles.row, { flexWrap: "wrap" }]}>
            {CODES.map((code) => {
              const stroke = STROKES[code],
                count = practice.profiles[stroke.kind]?.length || 0;
              return (
                <Button
                  key={code}
                  active={practice.calibrating === stroke.kind}
                  label={`Calibrar ${stroke.name}`}
                  onPress={() =>
                    practice.setCalibrating(
                      practice.calibrating === stroke.kind ? null : stroke.kind,
                    )
                  }
                >
                  {code} {count ? `· ${count}` : ""}
                </Button>
              );
            })}
          </View>
          {practice.calibrating && (
            <Text accessibilityLiveRegion="polite" style={styles.orangeText}>
              Toque somente{" "}
              {STROKES[
                CODES.find((c) => STROKES[c].kind === practice.calibrating)!
              ].name.toLowerCase()}
              . {practice.profiles[practice.calibrating]?.length || 0} ataques
              salvos. Toque na letra para concluir.
            </Text>
          )}
          <Label>
            CONFIANÇA{" "}
            {practice.confidence === null
              ? "—"
              : `${Math.round(practice.confidence * 100)}%`}{" "}
            · {practice.rejected} REJEITADOS
          </Label>
          <View style={{ gap: 8 }}>
            <Label>COMPENSAÇÃO DO MICROFONE</Label>
            <View style={styles.row}>
              <Button
                onPress={() =>
                  practice.setLatency((n) => Math.max(-200, n - 5))
                }
                label="Diminuir compensação"
              >
                −
              </Button>
              <Text style={styles.offset}>
                {practice.latency > 0 ? "+" : ""}
                {practice.latency} ms
              </Text>
              <Button
                onPress={() => practice.setLatency((n) => Math.min(200, n + 5))}
                label="Aumentar compensação"
              >
                +
              </Button>
            </View>
            <Text style={styles.hint}>
              Valor positivo desconta atraso da captura. Ajuste com golpes de
              referência.
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={practice.clearProfiles}
          >
            <Text style={styles.link}>Limpar calibração desta sessão</Text>
          </Pressable>
        </View>
      )}
      <Pressable
        accessibilityRole="button"
        onPress={() => setDetails((n) => !n)}
      >
        <Text style={styles.link}>
          {details ? "−" : "+"} Grade e fontes do ritmo
        </Text>
      </Pressable>
      {details && (
        <View style={{ gap: 10 }}>
          <Text style={styles.hint}>{rhythm.description}</Text>
          <Label>PASSOS POR TEMPO</Label>
          <View style={[styles.row, { flexWrap: "wrap" }]}>
            {[2, 3, 4, 6, 8].map((sub) => (
              <Button
                key={sub}
                active={subdivision === sub}
                onPress={() => practice.setSubdivision(sub)}
              >
                {sub}
              </Button>
            ))}
          </View>
          <Text style={styles.hint}>
            Grade: {rhythm.subdivisionSource}. O ajuste permite estudar outras
            subdivisões.
          </Text>
          {rhythm.sources.map((source, i) => (
            <Text key={i} style={styles.hint}>
              {i + 1}. {source}
            </Text>
          ))}
        </View>
      )}
      <Text style={styles.smallPrint}>
        Alterar ritmo, BPM, grade ou som reinicia o treino. A calibração vale
        nesta sessão.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.black }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.page}
      >
        <View style={styles.header}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
            <Pandeiro size={30} />
            <Text style={styles.brand}>
              PANDEIRO<Text style={{ color: T.orange }}>.APP</Text>
            </Text>
          </View>
          <Label>
            {wide ? "ESTÚDIO DE PRÁTICA / EXPERIMENTAL" : "LAB / 03"}
          </Label>
        </View>
        <View style={styles.intro}>
          <Label orange>O RITMO ESTÁ NAS SUAS MÃOS</Label>
          <Text
            style={[
              styles.hero,
              { fontSize: wide ? 72 : width < 390 ? 39 : 46 },
            ]}
          >
            {mode.title}
            <Text style={{ color: T.orange }}>.</Text>
          </Text>
          <Text style={styles.subtitle}>{mode.subtitle}</Text>
        </View>
        <View style={styles.tabs}>
          {MODES.map((tab, index) => (
            <Pressable
              key={tab.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: modeIndex === index }}
              accessibilityLabel={tab.name}
              onPress={() => setModeIndex(index)}
              style={[
                styles.tab,
                modeIndex === index && { borderBottomColor: T.orange },
              ]}
            >
              <Text
                style={[
                  styles.tabNumber,
                  modeIndex === index && { color: T.orange },
                ]}
              >
                {tab.number}
              </Text>
              <Text
                style={[
                  styles.tabName,
                  modeIndex === index && { color: T.ivory },
                ]}
              >
                {tab.name}
              </Text>
            </Pressable>
          ))}
        </View>
        {!!practice.error && (
          <View accessibilityRole="alert" style={styles.error}>
            <Text style={{ ...styles.hint, color: T.ivory, flex: 1 }}>
              {practice.error}
            </Text>
            <Button onPress={() => practice.setError("")} label="Fechar aviso">
              ✕
            </Button>
          </View>
        )}
        {!wide && (
          <View style={styles.settings}>
            <View style={styles.visualHeading}>
              <View style={{ flex: 1, gap: 5 }}>
                <Label orange>
                  SEU TREINO · {rhythm.sequence.length} PASSOS
                </Label>
                <Text style={[styles.rhythmName, { fontSize: 23 }]}>
                  {rhythm.name}
                </Text>
              </View>
              <Button
                label="Abrir biblioteca de ritmos"
                onPress={() => setLibrary(true)}
              >
                Ritmos ↗
              </Button>
            </View>
            <Transport practice={practice} compact />
          </View>
        )}
        <View
          style={[styles.workspace, { flexDirection: wide ? "row" : "column" }]}
        >
          <View style={{ flex: wide ? 1 : undefined, minWidth: 0, gap: 18 }}>
            <View style={styles.visual}>
              <View style={styles.visualHeading}>
                <Label>
                  {mode.number} / {mode.name.toUpperCase()}
                </Label>
                <Label orange>
                  {practice.running ? "● EM CURSO" : "○ EM PAUSA"}
                </Label>
              </View>
              <View
                style={{
                  minHeight: wide ? 455 : ringSize + 30,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 12,
                }}
              >
                {mode.id === "ring" && (
                  <RhythmRing
                    pattern={pattern}
                    phase={clock.phase}
                    bpm={bpm}
                    steps={rhythm.sequence.length}
                    subdivision={subdivision}
                    size={ringSize}
                    pulse={pulse}
                    running={practice.running}
                  >
                    <View style={styles.ringCenter}>
                      <Pandeiro size={ringSize * 0.25} />
                      <Text style={styles.stepNumber}>
                        {String(clock.step + 1).padStart(2, "0")}
                        <Text style={{ color: T.muted, fontSize: 13 }}>
                          {" "}
                          / {rhythm.sequence.length}
                        </Text>
                      </Text>
                      <Label>
                        {current
                          ? STROKES[
                              CODES.find((c) => STROKES[c].kind === current)!
                            ].name.toUpperCase()
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
                    steps={rhythm.sequence.length}
                    subdivision={subdivision}
                    toleranceMs={practice.tolerance}
                    width={chartWidth}
                    height={wide ? 350 : 280}
                  />
                )}
                {mode.id === "scatter" && (
                  <TimingScatter
                    hits={hits}
                    now={clock.t}
                    bpm={bpm}
                    toleranceMs={practice.tolerance}
                    width={chartWidth}
                    height={wide ? 300 : 260}
                    rangeMs={Math.max(
                      100,
                      Math.ceil(30000 / bpm / subdivision / 50) * 50,
                    )}
                  />
                )}
              </View>
              <View style={styles.visualFooter}>
                <Label>
                  {mode.id === "scatter"
                    ? "ADIANTADO ←"
                    : mode.id === "bars"
                      ? "CONTORNO · ESPERADO"
                      : `${rhythm.sequence.length} PASSOS / ${subdivision} POR TEMPO`}
                </Label>
                <Label orange>
                  {mode.id === "scatter"
                    ? "→ ATRASADO"
                    : mode.id === "bars"
                      ? "BRANCO · SUA MÃO"
                      : `${clock.bar.toFixed(2)} s / CICLO`}
                </Label>
              </View>
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
                    ? `${metrics.accuracy}% no tempo e golpe`
                    : "Comece a tocar"
                }
              />
              <Metric
                name="ERRO MÉDIO ABS."
                value={metrics.count ? `${Math.round(metrics.mae)}` : "—"}
                detail={
                  metrics.count
                    ? `ms · desvio ${Math.round(metrics.std)} ms`
                    : "Nenhum golpe registrado"
                }
              />
              <Metric
                name="GOLPES TOCADOS"
                value={String(hits.length).padStart(2, "0")}
                detail={
                  metrics.count
                    ? Math.abs(metrics.mean) < 2
                      ? "Tendência central"
                      : metrics.mean < 0
                        ? "Tendência: adiantado"
                        : "Tendência: atrasado"
                    : "Seu treino começa aqui"
                }
              />
            </View>
            <View style={styles.padSection}>
              <View style={styles.visualHeading}>
                <Label>TOQUE COM A SUA MÃO</Label>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setExtended((n) => !n)}
                >
                  <Text style={styles.link}>
                    {extended ? "Menos golpes −" : "9 golpes +"}
                  </Text>
                </Pressable>
              </View>
              <View style={[styles.row, { flexWrap: "wrap" }]}>
                {visibleCodes.map((code) => (
                  <Pressable
                    key={code}
                    accessibilityRole="button"
                    accessibilityLabel={`Tocar ${STROKES[code].name}`}
                    disabled={practice.source === "mic"}
                    {...(Platform.OS === "web" ? { delayPressIn: 0 } : {})}
                    onPressIn={() => practice.tap(STROKES[code].kind)}
                    style={({ pressed }) => [
                      styles.pad,
                      {
                        flexBasis: wide ? "17%" : "21%",
                        backgroundColor: pressed ? T.orange : T.panel,
                        opacity: practice.source === "mic" ? 0.4 : 1,
                        borderColor: pressed ? T.orange : T.line,
                      },
                    ]}
                  >
                    <View style={styles.padTop}>
                      <Text style={styles.padLetter}>{code}</Text>
                      {Platform.OS === "web" && (
                        <Text style={styles.key}>
                          {STROKES[code].key.toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.padName}>{STROKES[code].name}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.hint}>
                {practice.source === "mic"
                  ? "Os pads ficam desativados durante a captura. Calibre os timbres no painel do treino."
                  : Platform.OS === "web"
                    ? "Teclado: A grave · S dedos · D tapa · F punho · Espaço inicia/pausa."
                    : "O instante do primeiro contato com o pad registra o golpe."}
              </Text>
            </View>
            {mode.id === "ring" && (
              <View style={[styles.row, { flexWrap: "wrap" }]}>
                {visibleCodes.map((code) => (
                  <View key={code} style={styles.legend}>
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: T.kind[STROKES[code].kind],
                      }}
                    />
                    <Text style={styles.legendText}>
                      {code} {STROKES[code].name}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
          {settings}
        </View>
        <View style={styles.footer}>
          <Label>TREINE ATÉ VIRAR REFLEXO.</Label>
          <Label>PANDEIRO.APP / LAB</Label>
        </View>
      </ScrollView>
      <RhythmLibrary
        open={library}
        selected={rhythm.id}
        onSelect={setRhythm}
        onClose={() => setLibrary(false)}
      />
    </SafeAreaView>
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
    <View style={styles.metric}>
      <Label>{name}</Label>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricDetail}>{detail}</Text>
    </View>
  );
}
function Toggle({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        minHeight: 34,
      }}
    >
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        {...(Platform.OS === "web" ? { activeThumbColor: T.ivory } : {})}
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: T.line, true: T.orange }}
        thumbColor={T.ivory}
      />
    </View>
  );
}
function Transport({
  practice,
  compact = false,
}: {
  practice: ReturnType<typeof usePractice>;
  compact?: boolean;
}) {
  const play = (
    <Button
      primary
      disabled={!practice.ready || !!practice.calibrating}
      style={compact ? { flex: 1 } : undefined}
      onPress={() => void practice.toggle()}
      label={practice.running ? "Pausar treino" : "Iniciar treino"}
    >
      {!practice.ready
        ? "ÁUDIO…"
        : practice.running
          ? "Ⅱ PAUSAR"
          : compact
            ? "▶ INICIAR"
            : "▶ INICIAR TREINO"}
    </Button>
  );
  return (
    <View style={{ gap: 13 }}>
      {!compact && <Label>ANDAMENTO</Label>}
      <View
        style={{
          flexDirection: compact ? "row" : "column",
          gap: 12,
          alignItems: compact ? "center" : "stretch",
        }}
      >
        <View style={[styles.bpmRow, compact && { flex: 1.4 }]}>
          <Button
            onPress={() => practice.setBpm((n) => Math.max(30, n - 5))}
            label="Diminuir BPM"
          >
            −
          </Button>
          <View style={{ alignItems: "center", flex: 1 }}>
            <BpmInput
              compact={compact}
              value={practice.bpm}
              onChange={practice.setBpm}
            />
            <Label>BPM</Label>
          </View>
          <Button
            onPress={() => practice.setBpm((n) => Math.min(240, n + 5))}
            label="Aumentar BPM"
          >
            +
          </Button>
        </View>
        {play}
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Label>
          {practice.running
            ? `CICLO ${practice.clock.barIndex + 1} · PASSO ${practice.clock.step + 1}`
            : practice.hits.length
              ? "TREINO PAUSADO"
              : "PRONTO PARA COMEÇAR"}
        </Label>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reiniciar treino"
          onPress={practice.reset}
          hitSlop={10}
        >
          <Text style={styles.link}>Reiniciar ↺</Text>
        </Pressable>
      </View>
    </View>
  );
}
function BpmInput({
  value,
  onChange,
  compact = false,
}: {
  value: number;
  onChange: (n: number) => void;
  compact?: boolean;
}) {
  const [draft, setDraft] = useState(String(value));
  React.useEffect(() => {
    setDraft(String(value));
  }, [value]);
  const commit = () => {
    const n = Number(draft);
    if (Number.isFinite(n) && n >= 30 && n <= 240) onChange(Math.round(n));
    else setDraft(String(value));
  };
  return (
    <TextInput
      accessibilityLabel="BPM"
      value={draft}
      onChangeText={setDraft}
      keyboardType="number-pad"
      maxLength={3}
      selectTextOnFocus
      onBlur={commit}
      onSubmitEditing={commit}
      style={[styles.bpm, compact && { fontSize: 42, width: 74 }]}
    />
  );
}
const styles = StyleSheet.create({
  page: {
    width: "100%",
    maxWidth: 1240,
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 28,
    gap: 26,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: T.line,
    paddingBottom: 18,
    gap: 10,
  },
  brand: {
    color: T.ivory,
    fontFamily: fonts.title,
    fontSize: 20,
    letterSpacing: -0.7,
  },
  intro: { gap: 12, paddingTop: 12 },
  hero: {
    color: T.ivory,
    fontFamily: fonts.title,
    letterSpacing: -1.7,
    lineHeight: undefined,
  },
  subtitle: {
    color: T.muted,
    fontFamily: fonts.text,
    fontSize: 16,
    lineHeight: 23,
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: T.line,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  tabNumber: { color: T.muted, fontFamily: fonts.mono, fontSize: 10 },
  tabName: {
    color: T.muted,
    fontFamily: fonts.text,
    fontSize: 13,
    flexShrink: 1,
  },
  workspace: { gap: 24, alignItems: "stretch" },
  visual: {
    backgroundColor: T.panel,
    borderWidth: 1,
    borderColor: T.line,
    borderRadius: 8,
    padding: 15,
  },
  visualHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  visualFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: T.line,
  },
  ringCenter: {
    backgroundColor: T.panel,
    padding: 8,
    borderRadius: 100,
    alignItems: "center",
    gap: 3,
  },
  stepNumber: {
    fontFamily: fonts.title,
    fontSize: 34,
    color: T.ivory,
    letterSpacing: -1,
  },
  settings: {
    backgroundColor: T.panel,
    borderWidth: 1,
    borderColor: T.line,
    borderRadius: 8,
    padding: 20,
    gap: 19,
    alignSelf: "flex-start",
    width: "100%",
  },
  rhythmName: {
    fontFamily: fonts.title,
    fontSize: 29,
    letterSpacing: -0.6,
    color: T.ivory,
  },
  bpmRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  bpm: {
    fontFamily: fonts.title,
    color: T.ivory,
    fontSize: 57,
    textAlign: "center",
    padding: 0,
    width: 130,
    letterSpacing: -2,
  },
  row: { flexDirection: "row", gap: 8, alignItems: "center" },
  link: {
    color: T.orange,
    fontSize: 11,
    fontFamily: fonts.mono,
    lineHeight: 17,
  },
  hint: {
    color: T.muted,
    fontFamily: fonts.text,
    fontSize: 12,
    lineHeight: 18,
  },
  smallPrint: {
    color: T.muted,
    fontFamily: fonts.text,
    fontSize: 11,
    lineHeight: 16,
    opacity: 0.8,
  },
  toggleLabel: { fontFamily: fonts.text, color: T.ivory, fontSize: 15 },
  stats: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: T.line,
    borderRadius: 7,
  },
  metric: { flex: 1, padding: 13, gap: 7 },
  metricValue: {
    color: T.ivory,
    fontFamily: fonts.title,
    fontSize: 34,
    letterSpacing: -1,
  },
  metricDetail: {
    color: T.muted,
    fontFamily: fonts.text,
    fontSize: 11,
    lineHeight: 15,
  },
  padSection: { gap: 14 },
  pad: {
    flexGrow: 1,
    minHeight: 97,
    borderWidth: 1,
    borderRadius: 6,
    padding: 13,
    gap: 8,
  },
  padTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  padLetter: { color: T.ivory, fontFamily: fonts.title, fontSize: 27 },
  key: {
    fontFamily: fonts.mono,
    color: T.muted,
    fontSize: 10,
    borderWidth: 1,
    borderColor: T.line,
    padding: 4,
    borderRadius: 3,
  },
  padName: {
    color: T.ivory,
    fontFamily: fonts.text,
    fontSize: 12,
    lineHeight: 16,
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginRight: 7,
  },
  legendText: { fontFamily: fonts.mono, fontSize: 9, color: T.muted },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    paddingTop: 22,
    borderTopWidth: 1,
    borderTopColor: T.line,
  },
  error: {
    padding: 14,
    backgroundColor: "#28170C",
    borderWidth: 1,
    borderColor: T.orange,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  orangeText: {
    color: T.orange,
    fontFamily: fonts.text,
    fontSize: 13,
    lineHeight: 19,
  },
  offset: {
    flex: 1,
    textAlign: "center",
    color: T.ivory,
    fontFamily: fonts.mono,
    fontSize: 15,
  },
});
