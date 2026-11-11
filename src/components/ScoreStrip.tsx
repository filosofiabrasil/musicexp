import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Svg, { G, Line, Path, Rect, Text as SText } from "react-native-svg";
import {
  Rhythm,
  StrokeCode,
  Kind,
  STROKES,
  CODES,
  THEME as T,
} from "../pandeiro-ui-base/types";
import {
  METERS,
  beamRuns,
  meterFits,
  meterUnits,
  noteValue,
  metricDescription,
  readingGroups,
  countingGroups,
} from "../music/notation";
import { MusicGlyph, TimeValue, GlyphName } from "./MusicGlyph";
import { fonts, Label, Button } from "./ui";

export function ScoreStrip({
  rhythm,
  subdivision,
  width,
  current,
  selected,
  range,
  isolation,
  meter,
  onMeter,
  onSelect,
}: {
  rhythm: Rhythm;
  subdivision: number;
  width: number;
  current: number | null;
  selected: number;
  range: { start: number; end: number };
  isolation: Kind | null;
  meter: string | null;
  onMeter: (meter: string | null) => void;
  onSelect: (index: number) => void;
}) {
  const [view, setView] = useState<"rhythm" | "map">("rhythm");
  const steps = rhythm.sequence.length;
  const validMeter =
    meter && meterFits(meter, steps, subdivision) ? meter : undefined;
  const groups = readingGroups(rhythm, subdivision, validMeter);
  const present = CODES.filter((c) => rhythm.sequence.includes(c)).sort(
    (a, b) => STROKES[b].staffStep - STROKES[a].staffStep,
  );
  const margin = view === "map" ? 160 : validMeter ? 95 : 55;
  const full = Math.max(width, margin + steps * 40 + 14);
  const spacing = (full - margin - 14) / steps;
  const x = (i: number) => margin + (i + 0.5) * spacing;
  const measure = validMeter ? meterUnits(validMeter, subdivision)! : null;
  const value = noteValue(subdivision),
    runs = beamRuns(rhythm.sequence, subdivision, groups, measure);
  const beamed = new Set(runs.filter((run) => run.length > 1).flat());
  const counts = countingGroups(steps, subdivision, validMeter, groups);
  const groupLabel = groups.join("+");
  const compound = validMeter && ["6/8", "9/8", "12/8"].includes(validMeter);
  const staffTop = 78,
    staffSpace = 8,
    staffBottom = staffTop + staffSpace * 4,
    staffCenter = staffTop + staffSpace * 2;
  const noteY = (i: number) =>
    staffBottom -
    STROKES[rhythm.sequence[i] as StrokeCode].staffStep * (staffSpace / 2);
  const beamY = new Map<number, number>();
  runs
    .filter((run) => run.length > 1)
    .forEach((run) => {
      const y = Math.min(...run.map(noteY)) - 32;
      run.forEach((i) => beamY.set(i, y));
    });
  const height = view === "map" ? Math.max(130, present.length * 28 + 45) : 174;
  const inside = (i: number) =>
    i >= range.start &&
    i < range.end &&
    (!isolation ||
      STROKES[rhythm.sequence[i] as StrokeCode]?.kind === isolation);
  return (
    <View style={{ gap: 13 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <Button active={view === "rhythm"} onPress={() => setView("rhythm")}>
          Leitura rítmica
        </Button>
        <Button active={view === "map"} onPress={() => setView("map")}>
          Mapa de articulações
        </Button>
      </View>
      {view === "rhythm" && (
        <>
          <Label>MÉTRICA DE ESTUDO</Label>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            <Button active={!validMeter} onPress={() => onMeter(null)}>
              Sem fórmula
            </Button>
            {METERS.map((m) => (
              <Button
                key={m}
                label={`Métrica ${m}`}
                active={m === validMeter}
                disabled={!meterFits(m, steps, subdivision)}
                onPress={() => onMeter(m)}
              >
                {m}
              </Button>
            ))}
          </View>
          <Text style={caption}>
            {metricDescription(steps, subdivision, validMeter)} Opções ativas
            fecham compassos completos com grupos representáveis nesta grade. A
            escolha define a leitura deste estudo.
          </Text>
        </>
      )}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <Label>
          {view === "rhythm"
            ? "RITMO · PAUTA DE PERCUSSÃO EM CINCO LINHAS"
            : "ARTICULAÇÕES · LEGENDA DO CATÁLOGO"}
        </Label>
        <Label orange>
          {view === "rhythm"
            ? `1 unidade = ${value.denominator === 8 ? "colcheia" : value.denominator === 16 ? "semicolcheia" : "fusa"}${value.tuplet ? " em quiáltera" : ""}`
            : "POSIÇÃO VERTICAL = ARTICULAÇÃO"}
        </Label>
      </View>
      {view === "rhythm" && (
        <Label>
          CONTAGEM ·{" "}
          {validMeter === "7/8"
            ? `GRUPOS ${groupLabel} UNIDADES`
            : compound
              ? "PULSOS DE SEMÍNIMA PONTUADA"
              : validMeter
                ? "TEMPOS DE SEMÍNIMA"
                : "SEMÍNIMAS DO CICLO"}
        </Label>
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator
        contentContainerStyle={{ paddingBottom: 8 }}
      >
        <View style={{ width: full }}>
          <Svg
            width={full}
            height={height}
            accessibilityLabel={
              view === "rhythm"
                ? `Leitura rítmica de ${steps} unidades, ${steps / subdivision} semínimas${validMeter ? `, compasso ${validMeter}` : ""}, pauta de percussão em cinco linhas`
                : `Mapa das articulações de ${steps} unidades`
            }
          >
            {view === "rhythm" ? (
              <>
                {Array.from({ length: 5 }, (_, line) => {
                  const y = staffTop + line * staffSpace;
                  return (
                    <Line
                      key={line}
                      x1={margin - 8}
                      x2={full - 8}
                      y1={y}
                      y2={y}
                      stroke={T.silver}
                      strokeWidth={0.7}
                      opacity={0.78}
                    />
                  );
                })}
                <MusicGlyph
                  name="percussionClef"
                  x={22}
                  y={staffCenter + 6}
                  color={T.ivory}
                />
                {validMeter && (
                  <G>
                    <TimeValue
                      value={validMeter.split("/")[0]}
                      x={48}
                      y={89}
                      color={T.ivory}
                    />
                    <TimeValue
                      value={validMeter.split("/")[1]}
                      x={48}
                      y={111}
                      color={T.ivory}
                    />
                  </G>
                )}
                {counts.map((count) => (
                  <SText
                    key={count.start}
                    x={(x(count.start) + x(count.start + count.size - 1)) / 2}
                    y={17}
                    textAnchor="middle"
                    fontSize={11}
                    fill={T.silver}
                  >{`${count.bar ? `C${count.bar} · ` : ""}${validMeter ? "" : "♩ "}${count.number}`}</SText>
                ))}
                {Array.from(
                  { length: Math.ceil(steps / subdivision) },
                  (_, q) => {
                    const start = q * subdivision,
                      end = Math.min(start + subdivision, steps);
                    return (
                      <G key={q}>
                        {start > 0 && (!measure || start % measure !== 0) && (
                          <Line
                            x1={margin + start * spacing}
                            x2={margin + start * spacing}
                            y1={staffTop - 2}
                            y2={staffBottom + 4}
                            stroke={T.line}
                            strokeDasharray="2 4"
                          />
                        )}
                        {value.tuplet && (
                          <G>
                            <Path
                              d={`M ${x(start) - 10} 39 V 35 H ${x(end - 1) + 10} V 39`}
                              fill="none"
                              stroke={T.silver}
                              strokeWidth={0.7}
                            />
                            <SText
                              x={(x(start) + x(end - 1)) / 2}
                              y={31}
                              textAnchor="middle"
                              fontSize={11}
                              fill={T.ivory}
                            >{`${value.tuplet[0]}:${value.tuplet[1]}${end - start < subdivision ? "…" : ""}`}</SText>
                          </G>
                        )}
                      </G>
                    );
                  },
                )}
                {measure &&
                  Array.from({ length: steps / measure + 1 }, (_, n) => {
                    const at = margin + n * measure * spacing;
                    return (
                      <G key={n}>
                        <Line
                          x1={at}
                          x2={at}
                          y1={staffTop - 1}
                          y2={staffBottom + 2}
                          stroke={T.ivory}
                          strokeWidth={n === steps / measure ? 2 : 0.9}
                        />
                        {n === steps / measure && (
                          <Line
                            x1={at - 5}
                            x2={at - 5}
                            y1={staffTop - 1}
                            y2={staffBottom + 2}
                            stroke={T.ivory}
                          />
                        )}
                      </G>
                    );
                  })}
                {runs
                  .filter((run) => run.length > 1)
                  .map((run) => (
                    <G key={run[0]}>
                      {Array.from({ length: value.beams }, (_, b) => (
                        <Line
                          key={b}
                          x1={x(run[0]) + 4.5}
                          x2={x(run[run.length - 1]) + 4.5}
                          y1={beamY.get(run[0])! + b * 5.5}
                          y2={beamY.get(run[0])! + b * 5.5}
                          stroke={T.ivory}
                          strokeWidth={2.7}
                        />
                      ))}
                    </G>
                  ))}
                {[...rhythm.sequence].map((code, i) => {
                  const ink = i === current ? T.orange : T.ivory,
                    headY = code === "." ? staffCenter : noteY(i),
                    stemTip = beamY.get(i) ?? headY - 32;
                  return (
                    <G key={i} opacity={inside(i) ? 1 : 0.35}>
                      {i === current && (
                        <Rect
                          x={margin + i * spacing}
                          y={staffTop - 20}
                          width={spacing}
                          height={staffBottom - staffTop + 50}
                          fill={T.orange}
                          opacity={0.08}
                        />
                      )}
                      {code === "." ? (
                        <MusicGlyph
                          name={`rest${value.denominator}` as GlyphName}
                          x={x(i) - 4.5}
                          y={staffCenter}
                          color={ink}
                        />
                      ) : (
                        <>
                          <MusicGlyph
                            name="noteheadBlack"
                            x={x(i) - 4.7}
                            y={headY}
                            color={ink}
                          />
                          <Line
                            x1={x(i) + 4.5}
                            x2={x(i) + 4.5}
                            y1={headY - 1}
                            y2={stemTip}
                            stroke={ink}
                            strokeWidth={1.15}
                          />
                          {!beamed.has(i) && (
                            <MusicGlyph
                              name={`flag${value.denominator}` as GlyphName}
                              x={x(i) + 4.5}
                              y={stemTip}
                              color={ink}
                            />
                          )}
                          {rhythm.accents?.includes(i) && (
                            <Path
                              d={`M ${x(i) - 5} ${headY - 18} L ${x(i) + 5} ${headY - 15} L ${x(i) - 5} ${headY - 12}`}
                              stroke={T.ivory}
                              strokeWidth={1.5}
                              fill="none"
                            />
                          )}
                        </>
                      )}
                      <SText
                        x={x(i)}
                        y={132}
                        textAnchor="middle"
                        fontSize={12}
                        fill={i === selected ? T.orange : T.silver}
                      >
                        {code === "." ? "·" : code}
                      </SText>
                      <SText
                        x={x(i)}
                        y={160}
                        textAnchor="middle"
                        fontSize={12}
                        fill={T.ivory}
                      >
                        {i -
                          counts.find(
                            (count) =>
                              i >= count.start && i < count.start + count.size,
                          )!.start +
                          1}
                      </SText>
                    </G>
                  );
                })}
                <SText x={3} y={160} fontSize={8} fill={T.muted}>
                  SUB.
                </SText>
              </>
            ) : (
              <>
                {present.map((code, row) => (
                  <G key={code}>
                    <SText
                      x={4}
                      y={30 + row * 28}
                      fontSize={10}
                      fill={T.silver}
                    >
                      {code} · {STROKES[code].name}
                    </SText>
                    {[...rhythm.sequence].map((cell, i) => (
                      <G key={i} opacity={inside(i) ? 1 : 0.35}>
                        <Rect
                          x={margin + i * spacing + 2}
                          y={13 + row * 28}
                          width={spacing - 4}
                          height={25}
                          fill={
                            cell === code
                              ? i === current
                                ? T.orange
                                : T.ivory
                              : "none"
                          }
                          opacity={cell === code ? 0.16 : 1}
                          stroke={cell === code ? T.ivory : T.line}
                        />
                        {cell === code && (
                          <SText
                            x={x(i)}
                            y={30 + row * 28}
                            textAnchor="middle"
                            fill={i === current ? T.orange : T.ivory}
                            fontSize={12}
                          >
                            {code}
                          </SText>
                        )}
                      </G>
                    ))}
                  </G>
                ))}
              </>
            )}
          </Svg>
          <View
            style={{
              flexDirection: "row",
              paddingLeft: margin,
              paddingRight: 14,
            }}
          >
            {[...rhythm.sequence].map((code, i) => (
              <Pressable
                key={i}
                accessibilityRole="button"
                accessibilityLabel={`Inspecionar unidade ${i + 1}: ${code === "." ? "pausa" : STROKES[code as StrokeCode].name}`}
                onPress={() => onSelect(i)}
                style={{
                  width: spacing,
                  minHeight: 38,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: selected === i ? T.orange : T.line,
                  opacity: i >= range.start && i < range.end ? 1 : 0.4,
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.mono,
                    fontSize: 10,
                    color: selected === i ? T.orange : T.muted,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
      <Text style={caption}>
        {view === "rhythm"
          ? `Acima: ${validMeter === "7/8" ? `grupos de ${groupLabel} unidades` : compound ? "pulsos de semínima pontuada" : validMeter ? "tempos de semínima" : "semínimas do ciclo"}${validMeter ? "; C1, C2… identificam os compassos" : ""}. Abaixo: subdivisões contadas a partir de 1 em cada ${validMeter === "7/8" ? "grupo" : compound ? "pulso composto" : "semínima"}. Da linha inferior à superior: P grave · A abafado · Q grave de dedos · B punho · M médio · R rulo · X tapa de polegar · T tapa · D dedos. As cinco linhas são posições de articulação, não alturas afinadas. Figuras = duração; letras = golpes; 01… = índices de edição. Pausas não cortam a ressonância.`
          : "Este mapa mostra qual articulação ocupa cada unidade. As linhas são categorias; a leitura das durações está na aba Leitura rítmica."}
      </Text>
      {value.tuplet && steps % subdivision !== 0 && view === "rhythm" && (
        <Text style={caption}>
          A última quiáltera está incompleta neste ciclo. As reticências indicam
          o trecho parcial; não foram acrescentadas pausas.
        </Text>
      )}
    </View>
  );
}
const caption = {
  color: T.muted,
  fontFamily: fonts.text,
  fontSize: 12,
  lineHeight: 19,
};
