import React from "react";
import { Circle, G, Line, Path } from "react-native-svg";
import { Kind, THEME } from "../pandeiro-ui-base/types";
export function StrokeSymbol({
  kind,
  x,
  y,
  radius: r,
  active = false,
}: {
  kind: Kind;
  x: number;
  y: number;
  radius: number;
  active?: boolean;
}) {
  const fill = active ? THEME.orange : THEME.kind[kind],
    ink = active ? THEME.black : THEME.black;
  return (
    <G>
      <Circle
        cx={x}
        cy={y}
        r={r}
        fill={kind === "abafado" && !active ? THEME.black : fill}
        stroke={fill}
        strokeWidth={kind === "abafado" ? 2 : 0}
      />
      {(kind === "tapa" || kind === "tapaPolegar") && (
        <G
          stroke={ink}
          strokeWidth={Math.max(1.2, r * 0.16)}
          strokeLinecap="round"
        >
          <Line
            x1={x - r * 0.4}
            x2={x + r * 0.4}
            y1={y - r * 0.4}
            y2={y + r * 0.4}
          />
          <Line
            x1={x - r * 0.4}
            x2={x + r * 0.4}
            y1={y + r * 0.4}
            y2={y - r * 0.4}
          />
          {kind === "tapaPolegar" && (
            <Line
              x1={x - r * 0.4}
              x2={x + r * 0.4}
              y1={y + r * 0.72}
              y2={y + r * 0.72}
            />
          )}
        </G>
      )}
      {kind === "graveDedos" && (
        <Circle
          cx={x}
          cy={y}
          r={r * 0.58}
          stroke={ink}
          strokeWidth={1.6}
          fill="none"
        />
      )}
      {kind === "rulo" && (
        <Path
          d={`M ${x - r * 0.6} ${y} Q ${x - r * 0.3} ${y - r} ${x} ${y} T ${x + r * 0.6} ${y}`}
          stroke={ink}
          strokeWidth={1.4}
          fill="none"
        />
      )}
    </G>
  );
}
