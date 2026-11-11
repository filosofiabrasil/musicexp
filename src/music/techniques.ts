import { StrokeCode } from "../pandeiro-ui-base/types";
export const TECHNIQUE_ORDER: StrokeCode[] = [
  "P",
  "A",
  "Q",
  "D",
  "B",
  "M",
  "T",
  "X",
  "R",
];
export const TECHNIQUES: Record<
  StrokeCode,
  {
    family: string;
    contact: string;
    listen: string;
    distinction: string;
    status: string;
  }
> = {
  P: {
    family: "Membrana · graves",
    contact: "Polegar; grave solto.",
    listen: "Comparar o ataque com a permanência da ressonância.",
    distinction:
      "Grave é um registro sonoro; polegar é uma forma de articulação.",
    status: "Vocabulário do catálogo",
  },
  A: {
    family: "Membrana · graves",
    contact: "Grave de polegar com ressonância controlada.",
    listen: "Observar o decaimento em relação ao P.",
    distinction:
      "Abafar não equivale apenas a reduzir o volume; a técnica de abafamento varia entre escolas.",
    status: "Vocabulário do catálogo",
  },
  Q: {
    family: "Membrana · graves",
    contact: "Grave articulado com o conjunto dos dedos.",
    listen: "Comparar o registro grave de Q com a condução de D.",
    distinction:
      "Q e D usam dedos, mas indicam articulações diferentes no catálogo.",
    status: "Vocabulário do catálogo",
  },
  D: {
    family: "Condução",
    contact: "Pontas dos dedos.",
    listen: "Comparar a presença de platinelas e a nitidez do ataque.",
    distinction: "A posição exata depende do instrumento e da técnica adotada.",
    status: "Vocabulário do catálogo",
  },
  B: {
    family: "Condução",
    contact: "Base da mão, chamada punho no app.",
    listen: "Alternar D e B mantendo o intervalo entre ataques.",
    distinction: "Base da mão não é a articulação anatômica do pulso.",
    status: "Vocabulário do catálogo",
  },
  M: {
    family: "Condução",
    contact: "Médio: rótulo dos arquivos MEDIO fornecidos.",
    listen: "Comparar a gravação com D e B sem presumir equivalência técnica.",
    distinction:
      "A identificação detalhada deste golpe precisa de revisão por professor; não se deduz o dedo usado pelo nome do arquivo.",
    status: "Identificação técnica a confirmar",
  },
  T: {
    family: "Ataques secos",
    contact: "Tapa de mão.",
    listen: "Comparar ataque seco e ressonância residual.",
    distinction: "O tapa de mão T é separado do tapa de polegar X.",
    status: "Vocabulário do catálogo",
  },
  X: {
    family: "Ataques secos",
    contact: "Tapa de polegar.",
    listen: "Alternar T e X e observar a diferença de timbre.",
    distinction:
      "A letra X é uma articulação; a cabeça em cruz é uma convenção visual do app.",
    status: "Vocabulário do catálogo",
  },
  R: {
    family: "Texturas",
    contact: "Rulo: textura com sucessão rápida de ataques.",
    listen: "Observar continuidade e envelope, além de um ataque isolado.",
    distinction:
      "Um sample de rulo não é uma medição da regularidade do rulo do estudante. A análise atual não avalia esse domínio.",
    status: "Textura gravada",
  },
};
export const NOTATION_NOTE =
  "A leitura rítmica usa cinco linhas de percussão: cada articulação do catálogo ocupa uma posição fixa, da região grave à aguda. Figuras mostram duração e as letras nomeiam os golpes. Essas posições não são alturas afinadas. O mapa de articulações é uma grade separada. A grafia é uma convenção do app; não reproduz nem certifica os sistemas de Anunciação ou Stasi.";
