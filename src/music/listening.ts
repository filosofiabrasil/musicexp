import { StrokeCode, STROKES, Kind } from "../pandeiro-ui-base/types";
import { SOUND_BANK } from "../audio/sampleLibrary";
export const LISTENING_PAIRS: {
  codes: [StrokeCode, StrokeCode];
  title: string;
  question: string;
}[] = [
  {
    codes: ["P", "A"],
    title: "Solto ou abafado",
    question:
      "Qual gravação tem o grave mais sustentado? Escute ataque e decaimento, além do volume.",
  },
  {
    codes: ["D", "B"],
    title: "Dedos ou base da mão",
    question: "Compare a presença de platinelas e a definição de cada ataque.",
  },
  {
    codes: ["T", "X"],
    title: "Duas formas de tapa",
    question: "Reconheça a diferença entre as gravações de mão e polegar.",
  },
  {
    codes: ["D", "Q"],
    title: "Duas articulações de dedos",
    question:
      "Separe a condução de dedos do registro grave produzido pelos dedos.",
  },
];
export type ListeningQuestion = {
  code: StrokeCode;
  kind: Kind;
  sampleId: string;
};
export function listeningQuestion(
  pair: number,
  random = Math.random,
): ListeningQuestion {
  const entry = LISTENING_PAIRS[pair];
  if (!entry) throw new Error("Par de escuta inválido.");
  const code = entry.codes[Math.min(1, Math.max(0, Math.floor(random() * 2)))];
  const kind = STROKES[code].kind;
  const bank = SOUND_BANK[kind];
  const sample =
    bank[
      Math.min(bank.length - 1, Math.max(0, Math.floor(random() * bank.length)))
    ];
  return { code, kind, sampleId: sample.id };
}
