import React from "react";
import Svg, { Circle, G, Line, Rect, Text as SvgText } from "react-native-svg";
import { DetectedHit, Pattern, STROKES, THEME, kindCode } from "./types";
import { bestStepHit } from "../audio/timing";

export function HitBars({
  pattern,
  hits,
  now,
  phase,
  barStart,
  barDur,
  steps = 16,
  subdivision = 4,
  toleranceMs = 15,
  width = 340,
  height = 280,
}: {
  pattern: Pattern;
  hits: DetectedHit[];
  now: number;
  phase: number;
  barStart: number;
  barDur: number;
  steps?: number;
  subdivision?: number;
  toleranceMs?: number;
  width?: number;
  height?: number;
}) {
  const col = width / steps,
    bw = col * 0.62,
    base = height - 36,
    maxHeight = height - 68;
  const cycleHits = React.useMemo(
    () =>
      hits.filter(
        (h) =>
          h.nominal >= barStart - 1e-9 && h.nominal < barStart + barDur - 1e-9,
      ),
    [hits, barStart, barDur],
  );
  return (
    <Svg
      width={width}
      height={height}
      accessibilityLabel={`Barras de ${steps} passos. Contorno esperado, preenchimento tocado.`}
    >
      {[0.25, 0.5, 0.75, 1].map((h) => (
        <Line
          key={h}
          x1={0}
          x2={width}
          y1={base - h * maxHeight}
          y2={base - h * maxHeight}
          stroke={THEME.silver}
          opacity={0.08}
        />
      ))}
      {Array.from({ length: steps }, (_, i) => {
        const kind = pattern[i],
          x = i * col + (col - bw) / 2,
          nominal = barStart + (i * barDur) / steps;
        const atStep = cycleHits.filter(
          (h) => h.t <= now && Math.abs(h.nominal - nominal) < 0.001,
        );
        const hit = bestStepHit(atStep, nominal, kind, now, toleranceMs);
        const active = !!hit && now - hit.t < 0.14;
        const expectedHeight = kind
          ? maxHeight * STROKES[kindCode(kind)].height
          : 0;
        const actualHeight = hit
          ? maxHeight * STROKES[kindCode(hit.kind)].height
          : 0;
        return (
          <G key={i}>
            {i % subdivision === 0 && (
              <Line
                x1={i * col}
                x2={i * col}
                y1={12}
                y2={base + 4}
                stroke={THEME.silver}
                opacity={0.12}
              />
            )}
            {kind ? (
              <Rect
                x={x}
                y={base - expectedHeight}
                width={bw}
                height={expectedHeight}
                rx={2}
                fill="none"
                stroke={THEME.silver}
                strokeWidth={1}
                opacity={0.65}
              />
            ) : (
              <Circle
                cx={x + bw / 2}
                cy={base - 3}
                r={2}
                fill={THEME.silver}
                opacity={0.5}
              />
            )}
            {hit && (
              <Rect
                x={x + 2}
                y={base - actualHeight}
                width={Math.max(1, bw - 4)}
                height={actualHeight}
                rx={1}
                fill={active ? THEME.orange : THEME.ivory}
              />
            )}
            {atStep.length > 0 && !hit && (
              <Circle
                cx={x + bw / 2}
                cy={base + 9}
                r={2.5}
                fill={THEME.ivory}
              />
            )}
            {hit && hit.kind !== kind && (
              <SvgText
                x={x + bw / 2}
                y={base - actualHeight - 8}
                textAnchor="middle"
                fontSize={12}
                fill={THEME.orange}
              >
                ×
              </SvgText>
            )}
            <SvgText
              x={x + bw / 2}
              y={height - 10}
              textAnchor="middle"
              fontFamily="JetBrainsMono_500Medium"
              fontSize={steps > 24 ? 8 : 11}
              fill={THEME.muted}
            >
              {kind ? kindCode(kind) : "·"}
            </SvgText>
          </G>
        );
      })}
      <Line
        x1={phase * width}
        x2={phase * width}
        y1={0}
        y2={base + 14}
        stroke={THEME.orange}
        strokeWidth={2}
      />
    </Svg>
  );
}
