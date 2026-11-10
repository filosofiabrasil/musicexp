import React from "react";
import { Text, View } from "react-native";
import Svg, { Circle, Line, Rect, Text as SvgText } from "react-native-svg";
import { DetectedHit, STROKES, THEME, kindCode } from "./types";
import { withinTolerance } from "../audio/timing";

export function TimingScatter({
  hits,
  now,
  bpm,
  width = 340,
  height = 300,
  windowSec = 4,
  toleranceMs = 15,
  rangeMs = 150,
}: {
  hits: DetectedHit[];
  now: number;
  bpm: number;
  width?: number;
  height?: number;
  windowSec?: number;
  toleranceMs?: number;
  rangeMs?: number;
}) {
  const cx = width / 2,
    scale = (width / 2 - 18) / rangeMs;
  const seen = hits
    .slice(-120)
    .filter((h) => h.t <= now && now - h.t < windowSec);
  const last = hits[hits.length - 1],
    err = last ? (last.t - last.nominal) * 1000 : null;
  const good = err !== null && withinTolerance(err, toleranceMs);
  return (
    <View
      style={{ width }}
      accessibilityLabel="Gráfico do erro de tempo em milissegundos"
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <Text
          style={{
            color: good ? THEME.orange : THEME.ivory,
            fontSize: 64,
            fontFamily: "InterTight_900Black",
            letterSpacing: -3,
          }}
        >
          {err === null
            ? "—"
            : Math.round(err) === 0
              ? "±0"
              : `${err < 0 ? "−" : "+"}${Math.abs(Math.round(err))}`}
          <Text style={{ fontSize: 18, letterSpacing: 0 }}> ms</Text>
        </Text>
        <Text
          style={{
            color: THEME.muted,
            fontSize: 11,
            fontFamily: "JetBrainsMono_500Medium",
          }}
        >
          {err === null
            ? "TOQUE PARA MEDIR"
            : good
              ? "NO TEMPO"
              : err < 0
                ? "ADIANTADO"
                : "ATRASADO"}
        </Text>
      </View>
      <Svg width={width} height={height}>
        <Rect
          x={cx - toleranceMs * scale}
          width={2 * toleranceMs * scale}
          y={0}
          height={height - 28}
          fill={THEME.orange}
          opacity={0.08}
        />
        {[-1, -0.5, 0, 0.5, 1].map((v) => (
          <React.Fragment key={v}>
            <Line
              x1={cx + v * rangeMs * scale}
              x2={cx + v * rangeMs * scale}
              y1={0}
              y2={height - 28}
              stroke={v === 0 ? THEME.orange : THEME.silver}
              opacity={v === 0 ? 0.65 : 0.15}
              strokeDasharray={v === 0 ? undefined : "3 6"}
            />
            <SvgText
              x={cx + v * rangeMs * scale}
              y={height - 8}
              textAnchor="middle"
              fontSize={10}
              fill={THEME.muted}
            >
              {v > 0 ? "+" : ""}
              {Math.round(v * rangeMs)}
            </SvgText>
          </React.Fragment>
        ))}
        {seen.map((h, i) => {
          const deviation = (h.t - h.nominal) * 1000,
            age = now - h.t;
          return (
            <Circle
              key={`${h.t}-${i}`}
              cx={Math.max(10, Math.min(width - 10, cx + deviation * scale))}
              cy={height - 42 - (age / windowSec) * (height - 50)}
              r={4 + STROKES[kindCode(h.kind)].height * 4}
              fill={
                withinTolerance(deviation, toleranceMs)
                  ? THEME.orange
                  : THEME.ivory
              }
              opacity={Math.max(0.15, 1 - age / windowSec)}
            />
          );
        })}
      </Svg>
    </View>
  );
}
