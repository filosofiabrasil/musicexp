import React, { useState } from "react";
import {
  Platform,
  Pressable,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { usePractice } from "../hooks/usePractice";
import { Rhythm, CODES, STROKES, THEME as T } from "../pandeiro-ui-base/types";
import { SUBDIVISION_NAMES, SUBDIVISIONS } from "../music/score";
import { Button, Label, Separator, fonts } from "./ui";
type Practice = ReturnType<typeof usePractice>;

export function Transport({
  practice,
  compact = false,
}: {
  practice: Practice;
  compact?: boolean;
}) {
  return (
    <View style={{ gap: 13 }}>
      <Label>ANDAMENTO · SEMÍNIMA = BPM</Label>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Button
          label="Diminuir BPM"
          onPress={() => practice.setBpm((n) => Math.max(30, n - 5))}
        >
          −
        </Button>
        <View style={{ flex: 1, alignItems: "center" }}>
          <BpmInput value={practice.bpm} onChange={practice.setBpm} />
          <Label>30–240 BPM</Label>
        </View>
        <Button
          label="Aumentar BPM"
          onPress={() => practice.setBpm((n) => Math.min(240, n + 5))}
        >
          +
        </Button>
      </View>
      <Button
        primary
        disabled={
          !practice.ready ||
          practice.starting ||
          practice.micBusy ||
          !!practice.calibrating
        }
        onPress={() => void practice.toggle()}
        label={practice.running ? "Pausar treino" : "Iniciar treino"}
      >
        {practice.starting
          ? "INICIANDO…"
          : !practice.ready
            ? "PREPARANDO…"
            : practice.running
              ? "Ⅱ PAUSAR TOMADA"
              : "▶ INICIAR TOMADA"}
      </Button>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 8,
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
          <Text style={link}>Reiniciar ↺</Text>
        </Pressable>
      </View>
      {!compact && (
        <Text style={hint}>
          O ciclo tem {practice.sequence.length} unidades,{" "}
          {practice.groups.join("+")} em grupos. A grade usa{" "}
          {practice.subdivision} unidades por semínima.
        </Text>
      )}
    </View>
  );
}
export function PracticeControls({
  practice,
  rhythm,
  wide,
  openLibrary,
}: {
  practice: Practice;
  rhythm: Rhythm;
  wide: boolean;
  openLibrary: () => void;
}) {
  const [technical, setTechnical] = useState(false);
  React.useEffect(() => {
    if (practice.source === "mic") setTechnical(true);
  }, [practice.source]);
  const fractional = practice.sequence.length % practice.subdivision !== 0;
  return (
    <View
      style={{
        gap: 18,
        width: wide ? 306 : "100%",
        backgroundColor: T.panel,
        borderWidth: 1,
        borderColor: T.line,
        borderRadius: 6,
        padding: 20,
        alignSelf: "flex-start",
      }}
    >
      <Label orange>PARÂMETROS DE ESTUDO</Label>
      {wide && (
        <>
          <Text
            style={{ color: T.ivory, fontFamily: fonts.serif, fontSize: 27 }}
          >
            {rhythm.name}
          </Text>
          <Button label="Abrir biblioteca de ritmos" onPress={openLibrary}>
            Biblioteca de ritmos ↗
          </Button>
          <Separator />
          <Transport practice={practice} />
          <Separator />
        </>
      )}
      <Separator />
      <Label>ENTRADA DOS GOLPES</Label>
      <View style={row}>
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
      <Text style={hint}>
        {practice.source === "mic"
          ? "● Microfone ligado · reconhecimento experimental. Use fones para a referência não entrar na captura."
          : "Pads e teclado registram o primeiro contato. Pré-escuta de amostras não pontua."}
      </Text>
      <View style={{ gap: 9 }}>
        <Label>JANELA DE TOLERÂNCIA</Label>
        <View style={row}>
          {[15, 25, 40].map((ms) => (
            <Button
              key={ms}
              style={{ flex: 1 }}
              active={practice.tolerance === ms}
              onPress={() => practice.setTolerance(ms)}
            >
              ±{ms} ms
            </Button>
          ))}
        </View>
      </View>
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
        <Label>REFERÊNCIA DO CLIQUE</Label>
        <View style={row}>
          {(
            [
              ["pulse", "Pulso"],
              ["subdivision", "Subd."],
              ["groups", "Grupos"],
            ] as const
          ).map(([mode, label]) => (
            <Button
              key={mode}
              style={{ flex: 1 }}
              active={practice.clickMode === mode}
              label={`Clique ${label}`}
              onPress={() => practice.setClickMode(mode)}
            >
              {label}
            </Button>
          ))}
        </View>
        <Text style={hint}>
          {practice.clickMode === "pulse"
            ? "Semínimas regulares, inclusive quando o ciclo termina entre pulsos."
            : practice.clickMode === "subdivision"
              ? "Cada unidade da grade; referência de semínima diferenciada."
              : `Inícios dos grupos ${practice.groups.join("+")}; os intervalos podem ser diferentes.`}
          {fractional && practice.clickMode === "pulse"
            ? " O pulso não reinicia na volta deste ciclo fracionário."
            : ""}
        </Text>
      </View>
      <View style={{ gap: 9 }}>
        <Label>NÍVEL DO GUIA · GANHO RELATIVO</Label>
        <View style={row}>
          {(["p", "mp", "mf", "f"] as const).map((dynamic) => (
            <Button
              key={dynamic}
              style={{ flex: 1 }}
              active={practice.dynamic === dynamic}
              label={`Nível ${dynamic}`}
              onPress={() => practice.setDynamic(dynamic)}
            >
              {dynamic}
            </Button>
          ))}
        </View>
        <Text style={hint}>
          Acentos escritos alteram o guia. A intensidade do estudante não é
          avaliada pelo microfone.
        </Text>
      </View>
      <View style={{ gap: 9 }}>
        <Label>VOLUME DE SAÍDA</Label>
        <View style={[row, { flexWrap: "wrap" }]}>
          {[0, 0.25, 0.5, 0.75, 1].map((volume) => (
            <Button
              key={volume}
              active={practice.volume === volume}
              style={{ paddingHorizontal: 8 }}
              label={`Volume ${volume * 100}%`}
              onPress={() => practice.setVolume(volume)}
            >
              {volume * 100}%
            </Button>
          ))}
        </View>
        <Text style={hint}>Este controle preserva a tomada em andamento.</Text>
      </View>
      <View style={{ gap: 9 }}>
        <Label>REDUÇÃO POR ARTICULAÇÃO</Label>
        <View style={[row, { flexWrap: "wrap" }]}>
          <Button
            active={!practice.isolation}
            onPress={() => practice.setIsolation(null)}
          >
            Todas
          </Button>
          {CODES.map((code) => (
            <Button
              key={code}
              label={`Isolar ${code}`}
              active={practice.isolation === STROKES[code].kind}
              onPress={() => practice.setIsolation(STROKES[code].kind)}
            >
              {code}
            </Button>
          ))}
        </View>
        <Text style={hint}>
          A redução altera a referência e o conjunto avaliado. A escrita
          original permanece visível.
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => setTechnical((v) => !v)}
      >
        <Text style={link}>
          {technical ? "−" : "+"} Grade, fontes e calibração
        </Text>
      </Pressable>
      {technical && (
        <View style={{ gap: 14 }}>
          <Label>UNIDADES POR SEMÍNIMA</Label>
          <View style={[row, { flexWrap: "wrap" }]}>
            {SUBDIVISIONS.map((sub) => (
              <Button
                key={sub}
                active={practice.subdivision === sub}
                label={`${sub} unidades por semínima`}
                onPress={() => practice.setSubdivision(sub)}
              >
                {sub}
              </Button>
            ))}
          </View>
          <Text style={hint}>
            {SUBDIVISION_NAMES[practice.subdivision]} · origem da grade:{" "}
            {rhythm.subdivisionSource}. Alterar a subdivisão reinterpreta a
            escrita, sem mudar o número de unidades.
          </Text>
          <Text style={hint}>{rhythm.description}</Text>
          {rhythm.sources.map((source, index) => (
            <Text key={index} style={hint}>
              {index + 1}. {source}
            </Text>
          ))}
          {practice.source === "mic" && (
            <>
              <Separator />
              <Label>CALIBRAÇÃO DE TIMBRE</Label>
              <Text style={hint}>
                Fluxo de captura:{" "}
                {practice.captureRate
                  ? `${practice.captureRate} Hz`
                  : "aguardando sinal"}
                .
              </Text>
              <Text style={hint}>
                Escolha uma letra, toque três ataques isolados e toque na letra
                novamente para concluir. Até oito exemplos por articulação ficam
                nesta sessão.
              </Text>
              <View style={[row, { flexWrap: "wrap" }]}>
                {CODES.map((code) => {
                  const kind = STROKES[code].kind;
                  return (
                    <Button
                      key={code}
                      active={practice.calibrating === kind}
                      label={`Calibrar ${STROKES[code].name}`}
                      onPress={() =>
                        practice.setCalibrating(
                          practice.calibrating === kind ? null : kind,
                        )
                      }
                    >
                      {code} · {practice.profiles[kind]?.length || 0}
                    </Button>
                  );
                })}
              </View>
              {practice.calibrating && (
                <Text
                  accessibilityLiveRegion="polite"
                  style={{ ...hint, color: T.orange }}
                >
                  Calibrando{" "}
                  {
                    STROKES[
                      CODES.find(
                        (c) => STROKES[c].kind === practice.calibrating,
                      )!
                    ].name
                  }
                  . Selecione a mesma letra para encerrar.
                </Text>
              )}
              <Label>
                SEMELHANÇA{" "}
                {practice.confidence === null
                  ? "—"
                  : practice.confidence.toFixed(2)}{" "}
                / 1 · {practice.rejected} REJEITADOS
              </Label>
              <Text style={hint}>
                Escore heurístico, não probabilidade calibrada. Ataques
                anteriores à retomada são descartados.
              </Text>
              <Label>COMPENSAÇÃO FIXA DE CAPTURA</Label>
              <View style={row}>
                <Button
                  label="Diminuir compensação"
                  onPress={() =>
                    practice.setLatency((n) => Math.max(-200, n - 5))
                  }
                >
                  −
                </Button>
                <Text
                  style={{
                    color: T.ivory,
                    flex: 1,
                    textAlign: "center",
                    fontFamily: fonts.mono,
                  }}
                >
                  {practice.latency} ms
                </Text>
                <Button
                  label="Aumentar compensação"
                  onPress={() =>
                    practice.setLatency((n) => Math.min(200, n + 5))
                  }
                >
                  +
                </Button>
              </View>
              <Text style={hint}>
                Positivo desconta atraso. A precisão física de ±15 ms não foi
                certificada em celular.
              </Text>
              <Button onPress={practice.clearProfiles}>
                Limpar calibração da sessão
              </Button>
            </>
          )}
        </View>
      )}
      <Text style={{ ...hint, fontSize: 11 }}>
        Escrita, recorte, amostra, clique e nível do guia iniciam outra tomada.
        Registre o resumo ou exporte os golpes antes de mudar esses parâmetros.
        Volume de saída preserva os dados.
      </Text>
    </View>
  );
}
function BpmInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  React.useEffect(() => setDraft(String(value)), [value]);
  const commit = () => {
    const valueAsNumber = /^\d+$/.test(draft) ? Number(draft) : NaN;
    if (
      Number.isFinite(valueAsNumber) &&
      valueAsNumber >= 30 &&
      valueAsNumber <= 240
    ) {
      const rounded = Math.round(valueAsNumber);
      setDraft(String(rounded));
      onChange(rounded);
    } else setDraft(String(value));
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
      style={{
        color: T.ivory,
        fontFamily: fonts.text,
        fontSize: 43,
        textAlign: "center",
        width: 110,
        padding: 0,
      }}
    />
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
        minHeight: 32,
      }}
    >
      <Text style={{ color: T.ivory, fontFamily: fonts.text, fontSize: 14 }}>
        {label}
      </Text>
      <Switch
        {...(Platform.OS === "web" ? { activeThumbColor: T.ivory } : {})}
        accessibilityLabel={label}
        value={value}
        disabled={disabled}
        onValueChange={onChange}
        trackColor={{ false: T.line, true: T.orange }}
        thumbColor={T.ivory}
      />
    </View>
  );
}
const row = {
  flexDirection: "row" as const,
  gap: 7,
  alignItems: "center" as const,
};
const hint = {
  color: T.muted,
  fontFamily: fonts.text,
  fontSize: 12,
  lineHeight: 19,
};
const link = {
  color: T.orange,
  fontFamily: fonts.mono,
  fontSize: 11,
  lineHeight: 18,
};
