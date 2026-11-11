import React from "react";
import { Text, View } from "react-native";
import { StudyRecord } from "../study/records";
import { compareTakes } from "../study/compare";
import { THEME as T } from "../pandeiro-ui-base/types";
import { fonts, Label } from "./ui";
export function TakeComparison({ records }: { records: StudyRecord[] }) {
  if (records.length < 2)
    return (
      <View style={box}>
        <Label orange>COMPARAR TENTATIVAS</Label>
        <Text style={body}>
          Selecione duas tomadas abaixo. A comparação verifica se escrita,
          andamento, entrada e referências foram mantidos.
        </Text>
      </View>
    );
  const [a, b] = [...records].sort(
    (x, y) => Date.parse(x.createdAt) - Date.parse(y.createdAt),
  );
  const comparison = compareTakes(a, b);
  return (
    <View style={box}>
      <Label orange>COMPARAÇÃO DESCRITIVA · A → B</Label>
      <Text style={body}>
        A: {a.title} · {new Date(a.createdAt).toLocaleTimeString("pt-BR")} · B:{" "}
        {b.title} · {new Date(b.createdAt).toLocaleTimeString("pt-BR")}
      </Text>
      <Text
        accessibilityLiveRegion="polite"
        style={{ ...body, color: comparison.comparable ? T.ivory : T.orange }}
      >
        {comparison.comparable
          ? "Parâmetros de referência compatíveis."
          : `Condições diferentes: ${comparison.differences.join(", ")}. Os valores não isolam uma mudança de desempenho.`}
      </Text>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Text style={{ ...body, flex: 1 }}>Medida</Text>
        <Text style={number}>A</Text>
        <Text style={number}>B</Text>
      </View>
      {[
        ["Golpes", String(a.metrics.count), String(b.metrics.count)],
        [
          "Erro médio absoluto",
          `${a.metrics.mae.toFixed(1)} ms`,
          `${b.metrics.mae.toFixed(1)} ms`,
        ],
        [
          "Dispersão σ",
          `${a.metrics.std.toFixed(1)} ms`,
          `${b.metrics.std.toFixed(1)} ms`,
        ],
        [
          "Viés",
          `${a.metrics.mean.toFixed(1)} ms`,
          `${b.metrics.mean.toFixed(1)} ms`,
        ],
        [
          "Posições corretas",
          `${a.metrics.correct}/${a.metrics.expected}`,
          `${b.metrics.correct}/${b.metrics.expected}`,
        ],
      ].map(([label, first, second]) => (
        <View
          key={label}
          style={{
            flexDirection: "row",
            gap: 10,
            paddingVertical: 7,
            borderBottomWidth: 1,
            borderBottomColor: T.line,
          }}
        >
          <Text style={{ ...body, flex: 1 }}>{label}</Text>
          <Text style={number}>{first}</Text>
          <Text style={number}>{second}</Text>
        </View>
      ))}
      {comparison.comparable && comparison.enough && (
        <Text style={body}>
          Variação do erro médio absoluto B − A:{" "}
          {comparison.maeDifference >= 0 ? "+" : ""}
          {comparison.maeDifference.toFixed(1)} ms. Valor negativo significa
          menor erro nesta amostra.
        </Text>
      )}
      <Text style={body}>
        {!comparison.enough
          ? "Há poucos golpes para uma comparação estável. "
          : ""}
        Compare também escuta, ressonância e intenção. Duas tomadas não
        demonstram evolução ou significância estatística; os ajustes do
        microfone e do volume podem ter variado.
      </Text>
    </View>
  );
}
const body = {
  color: T.silver,
  fontFamily: fonts.text,
  fontSize: 13,
  lineHeight: 21,
};
const number = {
  color: T.ivory,
  fontFamily: fonts.mono,
  fontSize: 11,
  minWidth: 75,
  textAlign: "right" as const,
};
const box = {
  gap: 13,
  padding: 20,
  borderWidth: 1,
  borderColor: T.line,
  borderRadius: 5,
  backgroundColor: T.panel,
};
