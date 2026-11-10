import React from "react";
import { View } from "react-native";
import Svg, { Circle, G, Line, Text as SvgText } from "react-native-svg";
import { Pattern, THEME } from "./types";
import { StrokeSymbol } from "../components/StrokeSymbol";

export function RhythmRing({
  pattern,
  phase,
  bpm,
  steps = 16,
  subdivision = 4,
  size = 340,
  children,
  pulse = 0,
  running = true,
}: {
  pattern: Pattern;
  phase: number;
  bpm: number;
  steps?: number;
  subdivision?: number;
  size?: number;
  children?: React.ReactNode;
  pulse?: number;
  running?: boolean;
}) {
  const c = size / 2,
    radius = size * 0.405,
    stepPhase = phase * steps,
    step = Math.floor(stepPhase);
  const age = (stepPhase - step) * (60 / bpm / subdivision),
    angle = phase * Math.PI * 2 - Math.PI / 2;
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg
        width={size}
        height={size}
        style={{ position: "absolute" }}
        accessibilityLabel={`Roda de ${steps} passos, passo ${step + 1}`}
      >
        <Circle
          cx={c}
          cy={c}
          r={radius * 0.77}
          fill="none"
          stroke={THEME.silver}
          opacity={0.055}
        />
        <Circle
          cx={c}
          cy={c}
          r={radius}
          fill="none"
          stroke={THEME.silver}
          strokeWidth={1}
          opacity={0.25}
        />
        {Array.from({ length: steps }, (_, i) => {
          const a = (i / steps) * Math.PI * 2 - Math.PI / 2;
          const x = c + Math.cos(a) * radius,
            y = c + Math.sin(a) * radius,
            kind = pattern[i];
          const active = running && i === step && age < 0.16;
          const small =
            kind === "dedos" || kind === "punho" || kind === "medio";
          const r =
            Math.min(
              size * (small ? 0.018 : 0.032),
              ((Math.PI * radius) / steps) * 0.7,
            ) * (active ? 1.25 : 1);
          return (
            <G key={i}>
              <Circle
                cx={x}
                cy={y}
                r={Math.max(r + 5, 12)}
                fill="transparent"
              />
              {active && kind && (
                <Line
                  x1={c}
                  y1={c}
                  x2={x}
                  y2={y}
                  stroke={THEME.orange}
                  opacity={0.7}
                  strokeWidth={1.3}
                />
              )}
              {kind ? (
                <StrokeSymbol
                  kind={kind}
                  x={x}
                  y={y}
                  radius={r}
                  active={active}
                />
              ) : (
                <Circle cx={x} cy={y} r={2} fill={THEME.silver} opacity={0.7} />
              )}
              <SvgText
                x={c + Math.cos(a) * radius * 1.15}
                y={c + Math.sin(a) * radius * 1.15 + 3}
                textAnchor="middle"
                fontSize={size > 380 ? 10 : 8}
                fill={active ? THEME.orange : THEME.muted}
                opacity={active ? 1 : 0.65}
              >
                {i + 1}
              </SvgText>
            </G>
          );
        })}
        <Line
          x1={c}
          y1={c}
          x2={c + Math.cos(angle) * radius * 0.94}
          y2={c + Math.sin(angle) * radius * 0.94}
          stroke={THEME.orange}
          strokeWidth={1.7}
          opacity={running ? 1 : 0.4}
        />
      </Svg>
      <View
        pointerEvents="none"
        style={{
          alignItems: "center",
          transform: [{ scale: 1 + pulse * 0.04 }],
        }}
      >
        {children}
      </View>
    </View>
  );
}
