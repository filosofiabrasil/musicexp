import React from "react";
import Svg, { Circle, Ellipse, G, Line } from "react-native-svg";
import { THEME } from "../pandeiro-ui-base/types";
export function Pandeiro({ size = 110 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Circle
        cx={60}
        cy={62}
        r={48}
        fill={THEME.black}
        stroke={THEME.silver}
        strokeWidth={2}
      />
      <Circle
        cx={60}
        cy={58}
        r={45}
        fill="#1C1B17"
        stroke={THEME.ivory}
        strokeWidth={2}
      />
      <Circle cx={60} cy={58} r={39} fill={THEME.orange} opacity={0.9} />
      <Circle
        cx={60}
        cy={58}
        r={34}
        stroke={THEME.black}
        strokeWidth={0.6}
        opacity={0.22}
        fill="none"
      />
      {[0, 1, 2, 3, 4].map((i) => (
        <G key={i} transform={`rotate(${i * 72 + 18} 60 58)`}>
          <Ellipse
            cx={60}
            cy={15}
            rx={11}
            ry={4.5}
            fill={THEME.silver}
            stroke={THEME.black}
            strokeWidth={1}
          />
          <Line
            x1={51}
            x2={69}
            y1={15}
            y2={15}
            stroke={THEME.black}
            opacity={0.4}
          />
        </G>
      ))}
      <Circle cx={60} cy={58} r={3} fill={THEME.ivory} opacity={0.8} />
    </Svg>
  );
}
