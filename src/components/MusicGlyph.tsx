import React from "react";
import { G, Path } from "react-native-svg";
import data from "../data/music-glyphs.json";
export type GlyphName = keyof typeof data.glyphs;
export function MusicGlyph({
  name,
  x,
  y,
  scale = 0.032,
  color,
}: {
  name: GlyphName;
  x: number;
  y: number;
  scale?: number;
  color: string;
}) {
  return (
    <G transform={`translate(${x} ${y}) scale(${scale} ${-scale})`}>
      <Path d={data.glyphs[name].path} fill={color} />
    </G>
  );
}
export function TimeValue({
  value,
  x,
  y,
  color,
}: {
  value: string;
  x: number;
  y: number;
  color: string;
}) {
  return (
    <G>
      {[...value].map((digit, i) => (
        <MusicGlyph
          key={i}
          name={`time${digit}` as GlyphName}
          x={x + i * 12}
          y={y}
          scale={0.025}
          color={color}
        />
      ))}
    </G>
  );
}
