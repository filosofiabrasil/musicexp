import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Svg, {
  Circle,
  Ellipse,
  G,
  Line,
  Path,
  Text as SText,
} from "react-native-svg";
import {
  Rhythm,
  StrokeCode,
  Kind,
  STROKES,
  THEME as T,
} from "../pandeiro-ui-base/types";
import { defaultGroups, groupStarts, scorePosition } from "../music/score";
import { TECHNIQUES } from "../music/techniques";
import { fonts, Label } from "./ui";

export function ScoreStrip({
  rhythm,
  subdivision,
  width,
  current,
  selected,
  range,
  isolation,
  onSelect,
}: {
  rhythm: Rhythm;
  subdivision: number;
  width: number;
  current: number | null;
  selected: number;
  range: { start: number; end: number };
  isolation: Kind | null;
  onSelect: (index: number) => void;
}) {
  const steps = rhythm.sequence.length,
    cell = 38,
    margin = 42;
  const full = Math.max(width, margin + steps * cell + 12),
    spacing = (full - margin - 12) / steps;
  const groups =
      rhythm.subdivision === subdivision && rhythm.groups
        ? rhythm.groups
        : defaultGroups(steps, subdivision),
    starts = groupStarts(groups);
  const beams =
    subdivision === 8 ? 3 : subdivision === 4 || subdivision === 6 ? 2 : 1;
  return (
    <View style={{ gap: 10 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <Label>LEITURA RÍTMICA · TRÊS LINHAS</Label>
        <Label orange>
          {rhythm.meter && subdivision === rhythm.subdivision
            ? rhythm.meter
            : "CICLO / GRADE"}
        </Label>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator
        contentContainerStyle={{ paddingBottom: 8 }}
      >
        <View style={{ width: full }}>
          <Svg
            width={full}
            height={145}
            accessibilityLabel={`Leitura rítmica de ${steps} unidades, sem altura definida`}
          >
            {[65, 81, 97].map((y, i) => (
              <G key={y}>
                <Line
                  x1={margin - 14}
                  x2={full - 8}
                  y1={y}
                  y2={y}
                  stroke={T.silver}
                  opacity={0.3}
                />
                <SText x={4} y={y + 3} fontSize={8} fill={T.muted}>
                  {["SEC", "CON", "GRV"][i]}
                </SText>
              </G>
            ))}
            {starts.map((start, g) => {
              const positions = Array.from(
                { length: groups[g] },
                (_, i) => start + i,
              ).filter((i) => rhythm.sequence[i] !== ".");
              return (
                <G key={start}>
                  <Line
                    x1={margin + start * spacing - 12}
                    x2={margin + start * spacing - 12}
                    y1={51}
                    y2={108}
                    stroke={T.silver}
                    opacity={0.12}
                  />
                  {positions.length > 1 &&
                    Array.from({ length: beams }, (_, b) => (
                      <Line
                        key={b}
                        x1={margin + (positions[0] + 0.5) * spacing + 4}
                        x2={
                          margin +
                          (positions[positions.length - 1] + 0.5) * spacing +
                          4
                        }
                        y1={36 + b * 5}
                        y2={36 + b * 5}
                        stroke={T.ivory}
                        strokeWidth={2.8}
                      />
                    ))}
                  {(subdivision === 3 || subdivision === 6) &&
                    groups[g] === subdivision && (
                      <SText
                        x={margin + (start + groups[g] / 2) * spacing}
                        y={25}
                        fill={T.silver}
                        fontSize={11}
                        textAnchor="middle"
                      >
                        {subdivision === 3 ? "3:2" : "6:4"}
                      </SText>
                    )}
                </G>
              );
            })}
            {[...rhythm.sequence].map((code, i) => {
              const x = margin + (i + 0.5) * spacing,
                stroke = code === "." ? null : STROKES[code as StrokeCode],
                y = stroke ? TECHNIQUES[code as StrokeCode].lane + 15 : 81;
              const included =
                i >= range.start &&
                i < range.end &&
                (!isolation || stroke?.kind === isolation);
              const ink = i === current ? T.orange : T.ivory;
              const groupIndex = starts.findIndex(
                (start, g) => i >= start && i < start + groups[g],
              );
              const solo =
                [
                  ...rhythm.sequence.slice(
                    starts[groupIndex],
                    starts[groupIndex] + groups[groupIndex],
                  ),
                ].filter((c) => c !== ".").length === 1;
              return (
                <G key={i} opacity={included ? 1 : 0.28}>
                  {i === current && (
                    <Line
                      x1={x}
                      x2={x}
                      y1={10}
                      y2={140}
                      stroke={T.orange}
                      opacity={0.25}
                    />
                  )}
                  {stroke ? (
                    <>
                      {code === "T" || code === "X" ? (
                        <G stroke={ink} strokeWidth={1.8}>
                          <Line x1={x - 4} x2={x + 4} y1={y - 4} y2={y + 4} />
                          <Line x1={x - 4} x2={x + 4} y1={y + 4} y2={y - 4} />
                        </G>
                      ) : (
                        <Ellipse
                          cx={x}
                          cy={y}
                          rx={5.2}
                          ry={3.6}
                          fill={ink}
                          transform={`rotate(-15 ${x} ${y})`}
                        />
                      )}
                      <Line
                        x1={x + 4}
                        x2={x + 4}
                        y1={y}
                        y2={36}
                        stroke={ink}
                        strokeWidth={1.3}
                      />
                      {solo &&
                        Array.from({ length: beams }, (_, b) => (
                          <Path
                            key={b}
                            d={`M ${x + 4} ${36 + b * 6} Q ${x + 15} ${44 + b * 6} ${x + 7} ${53 + b * 6}`}
                            stroke={ink}
                            fill="none"
                            strokeWidth={1.5}
                          />
                        ))}
                      {code === "R" && (
                        <SText
                          x={x}
                          y={22}
                          fill={ink}
                          textAnchor="middle"
                          fontSize={11}
                        >
                          tr
                        </SText>
                      )}
                      {rhythm.accents?.includes(i) && (
                        <SText
                          x={x}
                          y={12}
                          fill={T.orange}
                          textAnchor="middle"
                          fontSize={16}
                        >
                          ›
                        </SText>
                      )}
                    </>
                  ) : (
                    <G stroke={ink} fill={ink}>
                      <Path
                        d={`M ${x + 4} 70 L ${x - 3} 94`}
                        strokeWidth={1.5}
                      />
                      {Array.from({ length: beams }, (_, b) => (
                        <G key={b}>
                          <Circle cx={x - 3 - b} cy={72 + b * 7} r={2.2} />
                          <Line
                            x1={x - 3 - b}
                            x2={x + 3 - b * 2}
                            y1={73 + b * 7}
                            y2={75 + b * 7}
                          />
                        </G>
                      ))}
                    </G>
                  )}
                  <SText
                    x={x}
                    y={122}
                    textAnchor="middle"
                    fill={i === selected ? T.orange : T.muted}
                    fontSize={11}
                  >
                    {code === "." ? "pausa" : code}
                  </SText>
                  <SText
                    x={x}
                    y={139}
                    textAnchor="middle"
                    fill={T.muted}
                    fontSize={8}
                  >
                    {scorePosition(i, subdivision)}
                  </SText>
                </G>
              );
            })}
          </Svg>
          <View
            style={{
              flexDirection: "row",
              paddingLeft: margin,
              paddingRight: 12,
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
                  minHeight: 36,
                  justifyContent: "center",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: selected === i ? T.orange : T.line,
                  backgroundColor: current === i ? "#2B1D13" : "transparent",
                  opacity: i >= range.start && i < range.end ? 1 : 0.45,
                }}
              >
                <Text
                  style={{
                    color: selected === i ? T.orange : T.muted,
                    fontFamily: fonts.mono,
                    fontSize: 10,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
      <Text
        style={{
          color: T.muted,
          fontFamily: fonts.text,
          fontSize: 12,
          lineHeight: 18,
        }}
      >
        As letras identificam articulações. A posição vertical não representa
        notas afinadas. Cada símbolo ocupa uma unidade da grade; pausas indicam
        ausência de novo ataque e não cortam a ressonância.
      </Text>
    </View>
  );
}
