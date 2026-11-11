import React, { useState } from "react";
import { Text, View } from "react-native";
import { usePractice } from "../hooks/usePractice";
import { LISTENING_PAIRS, listeningQuestion } from "../music/listening";
import { StrokeCode, STROKES, THEME as T } from "../pandeiro-ui-base/types";
import { fonts, Button, Label } from "./ui";
export function ListeningLab({
  practice,
}: {
  practice: ReturnType<typeof usePractice>;
}) {
  const [round, setRound] = useState(() => ({
    pair: 0,
    question: listeningQuestion(0),
    played: false,
    result: null as StrokeCode | null,
    correct: 0,
    total: 0,
  }));
  const [busy, setBusy] = useState(false);
  const pair = LISTENING_PAIRS[round.pair];
  const blocked =
    practice.source === "mic" || practice.micBusy || practice.volume === 0;
  const hear = async () => {
    setBusy(true);
    const heard = await practice.audition(
      round.question.kind,
      round.question.sampleId,
    );
    if (heard)
      setRound((current) =>
        current.question === round.question
          ? { ...current, played: true }
          : current,
      );
    setBusy(false);
  };
  const answer = (code: StrokeCode) =>
    setRound((current) =>
      current.result !== null || !current.played
        ? current
        : {
            ...current,
            result: code,
            total: current.total + 1,
            correct: current.correct + Number(code === current.question.code),
          },
    );
  return (
    <View
      style={{
        gap: 15,
        padding: 22,
        borderWidth: 1,
        borderColor: T.orange,
        borderRadius: 6,
        backgroundColor: T.panel,
      }}
    >
      <Label orange>LABORATÓRIO DE ESCUTA · RESPOSTA SEM VER O ARQUIVO</Label>
      <Text style={{ color: T.ivory, fontFamily: fonts.serif, fontSize: 30 }}>
        Reconhecer antes de nomear.
      </Text>
      <Text style={body}>
        Ouça as referências identificadas; depois tente reconhecer uma amostra
        oculta. A pergunta sorteia gravações reais dentro do par escolhido.
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {LISTENING_PAIRS.map((item, i) => (
          <Button
            key={item.title}
            active={round.pair === i}
            disabled={busy}
            onPress={() =>
              setRound({
                pair: i,
                question: listeningQuestion(i),
                played: false,
                result: null,
                correct: 0,
                total: 0,
              })
            }
          >
            {item.title}
          </Button>
        ))}
      </View>
      <Text style={body}>{pair.question}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {pair.codes.map((code) => (
          <Button
            key={code}
            disabled={blocked || busy}
            label={`Referência auditiva ${code}`}
            onPress={() => void practice.audition(STROKES[code].kind)}
          >
            Ouvir {code} · {STROKES[code].name}
          </Button>
        ))}
      </View>
      <Button
        primary
        disabled={blocked || busy}
        label="Ouvir exemplo oculto"
        onPress={() => void hear()}
      >
        {busy
          ? "Preparando…"
          : round.played
            ? "▶ Ouvir novamente"
            : "▶ Ouvir exemplo oculto"}
      </Button>
      <Text style={body}>Identifique a articulação do exemplo:</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {pair.codes.map((code) => (
          <Button
            key={code}
            disabled={!round.played || round.result !== null || blocked || busy}
            label={`Resposta auditiva ${code}`}
            onPress={() => answer(code)}
          >
            {code} · {STROKES[code].name}
          </Button>
        ))}
      </View>
      {round.result !== null && (
        <>
          <Text
            accessibilityLiveRegion="polite"
            style={{ ...body, color: T.ivory }}
          >
            {round.result === round.question.code
              ? "Identificação correta."
              : "Compare novamente as referências."}{" "}
            Exemplo: {round.question.code} · {STROKES[round.question.code].name}{" "}
            · arquivo {round.question.sampleId}.
          </Text>
          <Button
            disabled={busy}
            onPress={() =>
              setRound((current) => ({
                ...current,
                question: listeningQuestion(current.pair),
                played: false,
                result: null,
              }))
            }
          >
            Próximo exemplo
          </Button>
        </>
      )}
      <Label>
        {round.correct}/{round.total} IDENTIFICAÇÕES CORRETAS NESTA RODADA
      </Label>
      {blocked && (
        <Text style={{ ...body, color: T.orange }}>
          {practice.volume === 0
            ? "O volume está em zero. Ajuste a saída na Prática para ouvir."
            : "Encerre a captura para usar a escuta comparada."}
        </Text>
      )}
      <Text style={body}>
        O resultado descreve a identificação destes arquivos, sem medir sua
        técnica ou a qualidade do pandeiro. Os resultados da rodada ficam nesta
        tela enquanto ela está aberta.
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
