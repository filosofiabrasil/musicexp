import { defaultGroups, groupStarts } from "./score";

export const METERS = [
  "2/4",
  "3/4",
  "4/4",
  "6/8",
  "7/8",
  "9/8",
  "12/8",
] as const;
export type StudyMeter = (typeof METERS)[number];

export function meterUnits(meter: string, subdivision: number) {
  if (!METERS.includes(meter as StudyMeter)) return null;
  const [n, d] = meter.split("/").map(Number);
  const units = (n * 4 * subdivision) / d;
  return Number.isInteger(units) ? units : null;
}
export function meterFits(meter: string, steps: number, subdivision: number) {
  const units = meterUnits(meter, subdivision);
  const eighths = meter.endsWith("/8");
  return (
    units !== null &&
    units > 0 &&
    steps % units === 0 &&
    (!eighths || subdivision % 2 === 0)
  );
}
export function countingGroups(
  steps: number,
  subdivision: number,
  meter?: string,
  customGroups?: number[],
) {
  const groups =
    meter === "7/8" && customGroups
      ? customGroups
      : metricGroups(steps, subdivision, meter);
  const starts = groupStarts(groups);
  const measure = meter ? meterUnits(meter, subdivision) : null;
  const perBar =
    meter === "7/8"
      ? 3
      : meter && ["6/8", "9/8", "12/8"].includes(meter)
        ? Number(meter.split("/")[0]) / 3
        : meter
          ? Number(meter.split("/")[0])
          : 0;
  return groups.map((size, i) => ({
    start: starts[i],
    size,
    bar: measure ? Math.floor(starts[i] / measure) + 1 : null,
    number:
      meter === "7/8" && measure
        ? starts.filter(
            (start) =>
              start >= Math.floor(starts[i] / measure) * measure &&
              start <= starts[i],
          ).length
        : perBar
          ? (i % perBar) + 1
          : i + 1,
  }));
}
export function metricGroups(
  steps: number,
  subdivision: number,
  meter?: string,
) {
  if (!meter || !meterFits(meter, steps, subdivision))
    return defaultGroups(steps, subdivision);
  const units = meterUnits(meter, subdivision)!;
  const [n, d] = meter.split("/").map(Number);
  const unit = (subdivision * 4) / d;
  const one =
    d === 8 && n % 3 === 0
      ? (Array(n / 3).fill(3 * unit) as number[])
      : meter === "7/8"
        ? [2 * unit, 2 * unit, 3 * unit]
        : (Array(n).fill(unit) as number[]);
  return Array.from({ length: steps / units }, () => one).flat();
}
export function readingGroups(
  rhythm: {
    sequence: string;
    subdivision: number;
    groups?: number[];
    meter?: string;
  },
  subdivision: number,
  meter?: string,
) {
  return rhythm.groups &&
    rhythm.subdivision === subdivision &&
    (!meter || meter === rhythm.meter)
    ? rhythm.groups
    : metricGroups(rhythm.sequence.length, subdivision, meter);
}
export function noteValue(subdivision: number) {
  if (![2, 3, 4, 6, 8].includes(subdivision))
    throw new Error("Subdivisão não suportada.");
  return {
    denominator:
      subdivision === 2 || subdivision === 3 ? 8 : subdivision === 8 ? 32 : 16,
    beams:
      subdivision === 2 || subdivision === 3 ? 1 : subdivision === 8 ? 3 : 2,
    tuplet: subdivision === 3 ? [3, 2] : subdivision === 6 ? [6, 4] : null,
  };
}
/** As travessas nunca atravessam pausas, grupos ou fronteiras de quiálteras. */
export function beamRuns(
  sequence: string,
  subdivision: number,
  groups: number[],
  measure?: number | null,
) {
  const boundaries = new Set(groupStarts(groups));
  if (measure)
    for (let i = 0; i < sequence.length; i += measure) boundaries.add(i);
  if (subdivision === 3 || subdivision === 6)
    for (let i = 0; i < sequence.length; i += subdivision) boundaries.add(i);
  const runs: number[][] = [];
  let run: number[] = [];
  const flush = () => {
    if (run.length) runs.push(run);
    run = [];
  };
  for (let i = 0; i < sequence.length; i++) {
    if (boundaries.has(i)) flush();
    if (sequence[i] === ".") flush();
    else run.push(i);
  }
  flush();
  return runs;
}
export function countPosition(index: number, subdivision: number) {
  return {
    quarter: Math.floor(index / subdivision) + 1,
    unit: (index % subdivision) + 1,
  };
}
export function metricDescription(
  steps: number,
  subdivision: number,
  meter?: string,
) {
  const quarterSpan = steps / subdivision;
  const amount = quarterSpan.toLocaleString("pt-BR", {
    maximumFractionDigits: 3,
  });
  if (!meter || !meterFits(meter, steps, subdivision))
    return `${steps} unidades = ${amount} ${quarterSpan === 1 ? "semínima" : "semínimas"}; fórmula de compasso não declarada.`;
  const bars = steps / meterUnits(meter, subdivision)!;
  const compound = ["6/8", "9/8", "12/8"].includes(meter);
  return `${bars} ${bars === 1 ? "compasso" : "compassos"} de ${meter} · ${amount} semínimas${compound ? "; pulso métrico de semínima pontuada" : ""}.`;
}
