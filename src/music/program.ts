export type StudyProgram = "free" | "steady" | "memory";
export const PROGRAMS: { id: StudyProgram; name: string; purpose: string }[] = [
  {
    id: "free",
    name: "Exploração livre",
    purpose:
      "Ouça e investigue a escrita. Sem limite de ciclos ou contagem de entrada.",
  },
  {
    id: "steady",
    name: "Tomada de 4 ciclos",
    purpose:
      "Quatro semínimas de preparação, quatro ciclos de execução e término automático. Compare tentativas com a mesma duração.",
  },
  {
    id: "memory",
    name: "Memória de pulso",
    purpose:
      "Quatro semínimas de preparação. O guia ligado atua no ciclo 1; o clique ligado atua nos ciclos 1 e 2. Sustente a pulsação nos ciclos 3 e 4 sem novos ataques de referência.",
  },
];
export function programPlan(program: StudyProgram) {
  if (program === "free")
    return {
      countIn: 0,
      cycles: 0,
      guideCycles: Infinity,
      clickCycles: Infinity,
    };
  if (program === "steady")
    return {
      countIn: 4,
      cycles: 4,
      guideCycles: Infinity,
      clickCycles: Infinity,
    };
  if (program === "memory")
    return { countIn: 4, cycles: 4, guideCycles: 1, clickCycles: 2 };
  throw new Error("Programa de estudo inválido.");
}
export function programStage(
  program: StudyProgram,
  t: number,
  bpm: number,
  cycleDuration: number,
) {
  const plan = programPlan(program);
  if (t < 0) return `Preparação · ${Math.max(1, Math.ceil((-t * bpm) / 60))}`;
  const cycle = Math.floor(t / cycleDuration + 1e-9);
  if (plan.cycles && cycle >= plan.cycles) return "Tomada concluída";
  if (program === "memory")
    return cycle === 0
      ? "Ciclo 1 · escutar e tocar"
      : cycle === 1
        ? "Ciclo 2 · tocar com clique"
        : `Ciclo ${cycle + 1} · sustentar sem referência`;
  return `Ciclo ${cycle + 1}${plan.cycles ? ` de ${plan.cycles}` : ""}`;
}
