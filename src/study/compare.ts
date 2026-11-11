import { StudyRecord } from "./records";
import { CODES, STROKES } from "../pandeiro-ui-base/types";
import { soundVariant } from "../audio/sampleLibrary";
/** Uma diferença de número não prova evolução se o protocolo mudou. */
export function compareTakes(a: StudyRecord, b: StudyRecord) {
  const differences: string[] = [];
  const different = (test: boolean, label: string) => {
    if (test) differences.push(label);
  };
  different(a.sequence !== b.sequence, "escrita");
  different(a.settings.bpm !== b.settings.bpm, "andamento");
  different(a.settings.subdivision !== b.settings.subdivision, "subdivisão");
  different(a.settings.source !== b.settings.source, "origem da entrada");
  different(a.settings.tolerance !== b.settings.tolerance, "tolerância");
  different(a.settings.latencyMs !== b.settings.latencyMs, "compensação");
  different(
    a.settings.isolation !== b.settings.isolation,
    "redução de articulações",
  );
  different(
    (a.settings.meter ?? null) !== (b.settings.meter ?? null),
    "métrica",
  );
  different(
    (a.settings.program ?? "free") !== (b.settings.program ?? "free"),
    "programa",
  );
  different(
    JSON.stringify(a.settings.groups) !== JSON.stringify(b.settings.groups),
    "agrupamento",
  );
  different(
    a.settings.guide !== b.settings.guide ||
      a.settings.click !== b.settings.click ||
      a.settings.clickMode !== b.settings.clickMode,
    "referência sonora",
  );
  different(
    a.settings.dynamic !== b.settings.dynamic ||
      a.settings.volume !== b.settings.volume,
    "ganho final de saída",
  );
  different(
    CODES.some((code) => {
      const kind = STROKES[code].kind;
      return (
        soundVariant(kind, a.settings.sampleChoices?.[kind]).id !==
        soundVariant(kind, b.settings.sampleChoices?.[kind]).id
      );
    }),
    "amostras",
  );
  different(
    a.settings.source === "mic" &&
      a.settings.captureRate !== b.settings.captureRate,
    "taxa de captura",
  );
  const enough =
    a.metrics.count >= 8 &&
    b.metrics.count >= 8 &&
    a.metrics.expected > 0 &&
    b.metrics.expected > 0;
  return {
    differences,
    comparable: differences.length === 0,
    enough,
    maeDifference: b.metrics.mae - a.metrics.mae,
    stdDifference: b.metrics.std - a.metrics.std,
  };
}
