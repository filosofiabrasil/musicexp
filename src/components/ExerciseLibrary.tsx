import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import {
  Rhythm,
  CODES,
  STROKES,
  StrokeCode,
  THEME as T,
} from "../pandeiro-ui-base/types";
import { ETUDES } from "../music/etudes";
import {
  SUBDIVISIONS,
  SUBDIVISION_NAMES,
  buildCustomRhythm,
  parseSequence,
} from "../music/score";
import { Button, Label, Separator, fonts } from "./ui";
import { METERS, meterFits } from "../music/notation";
import { useProjects } from "../hooks/useProjects";
import { exportFile } from "../storage/exportFile";
export type EditorDraft = {
  name: string;
  sequence: string;
  subdivision: number;
  grouping: string;
  paint: StrokeCode | "." | ">";
  meter?: string | null;
  accents?: number[];
};
export const INITIAL_DRAFT: EditorDraft = {
  name: "Estudo pessoal",
  sequence: "PDBDPDBD",
  subdivision: 4,
  grouping: "4+4",
  paint: "P",
};
export function ExerciseLibrary({
  onChoose,
  draft,
  setDraft,
  projects,
  current,
}: {
  onChoose: (rhythm: Rhythm) => void;
  draft: EditorDraft;
  setDraft: React.Dispatch<React.SetStateAction<EditorDraft>>;
  projects: ReturnType<typeof useProjects>;
  current: Rhythm;
}) {
  const [message, setMessage] = useState("");
  let prepared: Rhythm | null = null,
    error = "",
    sequence = "";
  try {
    sequence = parseSequence(draft.sequence);
    const proposed = buildCustomRhythm(
      draft.name,
      draft.sequence,
      draft.subdivision,
      draft.grouping,
    );
    if (
      draft.meter &&
      !meterFits(draft.meter, sequence.length, draft.subdivision)
    )
      throw new Error("A escrita não fecha compassos completos nessa métrica.");
    prepared = {
      ...proposed,
      ...(draft.meter ? { meter: draft.meter } : {}),
      accents: (draft.accents ?? []).filter(
        (i) => i >= 0 && i < sequence.length && sequence[i] !== ".",
      ),
    };
  } catch (e) {
    error = e instanceof Error ? e.message : "Escrita inválida.";
  }
  const update = (patch: Partial<EditorDraft>) =>
    setDraft((value) => ({ ...value, ...patch }));
  const load = (rhythm: Rhythm) => {
    setDraft({
      name: rhythm.name,
      sequence: rhythm.sequence,
      subdivision: rhythm.subdivision,
      grouping: (
        rhythm.groups ??
        Array.from(
          { length: Math.ceil(rhythm.sequence.length / rhythm.subdivision) },
          (_, i) =>
            Math.min(
              rhythm.subdivision,
              rhythm.sequence.length - i * rhythm.subdivision,
            ),
        )
      ).join("+"),
      paint: "P",
      meter: rhythm.meter ?? null,
      accents: rhythm.accents ?? [],
    });
    setMessage(
      "Escrita carregada no editor. Alterações só entram na prática ao aplicar.",
    );
  };
  return (
    <View style={{ gap: 24 }}>
      <View style={{ gap: 8 }}>
        <Label orange>LEITURA, ESCRITA E ORGANIZAÇÃO MÉTRICA</Label>
        <Text style={title}>Estudos técnicos e rascunho.</Text>
        <Text style={body}>
          Propostas originais para praticar regularidade, articulações, pausas e
          acentos. Não são transcrições de obras eruditas. O BPM é sempre
          referido à semínima; grupos e compassos são informados separadamente.
        </Text>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
        {ETUDES.map((r) => (
          <View
            key={r.id}
            style={{
              flexGrow: 1,
              flexBasis: 290,
              gap: 13,
              padding: 20,
              backgroundColor: T.panel,
              borderWidth: 1,
              borderColor: T.line,
              borderRadius: 5,
            }}
          >
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Label>
                {r.meter} · {r.sequence.length} UNIDADES
              </Label>
              <Label orange>{r.groups!.join("+")}</Label>
            </View>
            <Text style={{ ...title, fontSize: 25 }}>{r.name}</Text>
            <Text style={body}>{r.objective}</Text>
            <Text
              style={{
                color: T.silver,
                fontFamily: fonts.mono,
                fontSize: 11,
                letterSpacing: 1.4,
              }}
            >
              {r.sequence}
            </Text>
            <Button label={`Praticar ${r.name}`} onPress={() => onChoose(r)}>
              Abrir estudo →
            </Button>
          </View>
        ))}
      </View>
      <View
        style={{
          gap: 17,
          backgroundColor: T.panel,
          padding: 22,
          borderWidth: 1,
          borderColor: T.line,
          borderRadius: 5,
        }}
      >
        <Label orange>LABORATÓRIO DE ESCRITA · 1 A 32 UNIDADES</Label>
        <Text style={{ ...title, fontSize: 29 }}>
          Escreva uma hipótese rítmica.
        </Text>
        <Button onPress={() => load(current)}>Trazer escrita da prática</Button>
        <TextInput
          accessibilityLabel="Nome do estudo pessoal"
          value={draft.name}
          onChangeText={(name) => update({ name })}
          maxLength={64}
          placeholder="Nome do estudo"
          placeholderTextColor={T.muted}
          style={input}
        />
        <TextInput
          accessibilityLabel="Sequência de articulações"
          value={draft.sequence}
          onChangeText={(value) => update({ sequence: value, accents: [] })}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={100}
          style={{ ...input, fontFamily: fonts.mono, letterSpacing: 2 }}
        />
        <Text style={body}>
          Cada letra é uma unidade. Use ponto para pausa; espaços e | apenas
          separam visualmente. Escolha uma articulação e toque nas unidades para
          substituí-las. A ferramenta &gt; alterna acentos. Editar o texto da
          sequência remove os acentos existentes.
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
          {[...CODES, "." as const, ">" as const].map((code) => (
            <Button
              key={code}
              active={draft.paint === code}
              label={`Ferramenta ${code === "." ? "pausa" : code === ">" ? "acento" : STROKES[code].name}`}
              onPress={() => update({ paint: code })}
            >
              {code}
            </Button>
          ))}
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5 }}>
          {[...sequence].map((code, index) => (
            <Pressable
              key={index}
              accessibilityRole="button"
              accessibilityLabel={`Editar unidade ${index + 1}`}
              disabled={draft.paint === ">" && code === "."}
              onPress={() =>
                draft.paint === ">"
                  ? update({
                      accents: (draft.accents ?? []).includes(index)
                        ? draft.accents!.filter((i) => i !== index)
                        : [...(draft.accents ?? []), index],
                    })
                  : update({
                      sequence:
                        sequence.slice(0, index) +
                        draft.paint +
                        sequence.slice(index + 1),
                      ...(draft.paint === "."
                        ? {
                            accents: (draft.accents ?? []).filter(
                              (i) => i !== index,
                            ),
                          }
                        : {}),
                    })
              }
              style={{
                minWidth: 45,
                minHeight: 57,
                padding: 8,
                alignItems: "center",
                borderWidth: 1,
                borderColor: T.line,
                gap: 3,
              }}
            >
              <Text
                style={{ color: T.muted, fontFamily: fonts.mono, fontSize: 9 }}
              >
                {index + 1}
              </Text>
              <Text
                style={{ color: T.ivory, fontFamily: fonts.mono, fontSize: 17 }}
              >
                {(draft.accents ?? []).includes(index) ? "> " : ""}
                {code}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <Button
            disabled={!sequence || sequence.length >= 32}
            onPress={() => update({ sequence: sequence + "." })}
          >
            + Pausa no fim
          </Button>
          <Button
            disabled={!sequence}
            onPress={() =>
              update({
                sequence: sequence.slice(1) + sequence[0],
                accents: (draft.accents ?? []).map(
                  (i) => (i - 1 + sequence.length) % sequence.length,
                ),
              })
            }
          >
            Girar uma unidade ←
          </Button>
          <Button
            disabled={sequence.length <= 1}
            onPress={() =>
              update({
                sequence: sequence.slice(0, -1),
                accents: (draft.accents ?? []).filter(
                  (i) => i < sequence.length - 1,
                ),
              })
            }
          >
            − Última unidade
          </Button>
        </View>
        <Separator />
        <Label>UNIDADES POR SEMÍNIMA</Label>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {SUBDIVISIONS.map((sub) => (
            <Button
              key={sub}
              active={draft.subdivision === sub}
              onPress={() => update({ subdivision: sub })}
            >
              {sub} · {SUBDIVISION_NAMES[sub]}
            </Button>
          ))}
        </View>
        <Label>AGRUPAMENTO ADITIVO</Label>
        <TextInput
          accessibilityLabel="Agrupamento do estudo pessoal"
          value={draft.grouping}
          onChangeText={(grouping) => update({ grouping })}
          autoCorrect={false}
          placeholder="4+4 ou 2+2+3"
          placeholderTextColor={T.muted}
          style={input}
        />
        <Text style={body}>
          A soma precisa coincidir com o número de unidades. Um agrupamento não
          determina, por si só, uma fórmula de compasso.
        </Text>
        <Label>FÓRMULA DE COMPASSO DO ESTUDO</Label>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
          <Button active={!draft.meter} onPress={() => update({ meter: null })}>
            Sem fórmula
          </Button>
          {METERS.map((m) => (
            <Button
              key={m}
              active={draft.meter === m}
              disabled={
                !sequence || !meterFits(m, sequence.length, draft.subdivision)
              }
              label={`Compasso do editor ${m}`}
              onPress={() => update({ meter: m })}
            >
              {m}
            </Button>
          ))}
        </View>
        {!!error && (
          <Text
            accessibilityLiveRegion="polite"
            style={{ ...body, color: T.orange }}
          >
            {error}
          </Text>
        )}
        <Button
          primary
          disabled={!prepared}
          label="Aplicar estudo pessoal"
          onPress={() => prepared && onChoose(prepared)}
        >
          Aplicar e estudar →
        </Button>
        <Button
          disabled={!prepared || !projects.loaded}
          onPress={() => {
            if (prepared)
              void projects
                .save(prepared)
                .then(() => setMessage("Escrita salva na biblioteca pessoal."))
                .catch(() => {});
          }}
        >
          Salvar escrita
        </Button>
        {!!message && (
          <Text
            accessibilityLiveRegion="polite"
            style={{ ...body, color: T.orange }}
          >
            {message}
          </Text>
        )}
        {!!projects.error && (
          <Text accessibilityRole="alert" style={{ ...body, color: T.orange }}>
            {projects.error}
          </Text>
        )}
      </View>
      <View style={{ gap: 14 }}>
        <Label orange>MINHAS ESCRITAS · {projects.projects.length}/30</Label>
        <Text style={body}>
          Crie variações de acento ou rotação e salve cada versão. Arquivos
          pessoais ficam neste dispositivo; exporte uma cópia para conservar o
          trabalho.
        </Text>
        <Button
          disabled={!projects.projects.length}
          onPress={() =>
            void exportFile(
              "pandeiro-escritas.json",
              JSON.stringify(
                { schemaVersion: 1, projects: projects.projects },
                null,
                2,
              ),
              "application/json",
            ).catch(() => setMessage("Não foi possível exportar as escritas."))
          }
        >
          Exportar minhas escritas
        </Button>
        {projects.rawBackup !== null && (
          <Button
            onPress={() =>
              void exportFile(
                "pandeiro-escritas-recuperacao.txt",
                projects.rawBackup!,
                "text/plain",
              ).catch(() => setMessage("Falha ao exportar recuperação."))
            }
          >
            Exportar escritas preservadas
          </Button>
        )}
        {projects.removed && (
          <Button onPress={() => void projects.undo().catch(() => {})}>
            Desfazer remoção da escrita
          </Button>
        )}
        {!projects.projects.length && (
          <Text style={body}>Ainda não há escritas salvas.</Text>
        )}
        {projects.projects.map((project) => (
          <View
            key={project.id}
            style={{
              gap: 10,
              padding: 18,
              borderWidth: 1,
              borderColor: T.line,
              borderRadius: 5,
            }}
          >
            <Text style={{ ...title, fontSize: 26 }}>
              {project.rhythm.name}
            </Text>
            <Text style={body}>
              {project.rhythm.sequence} ·{" "}
              {project.rhythm.meter ?? "sem fórmula"} ·{" "}
              {project.rhythm.subdivision} unidades/semínima
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
              <Button
                label={`Editar escrita ${project.id}`}
                onPress={() => load(project.rhythm)}
              >
                Abrir no editor
              </Button>
              <Button
                label={`Praticar escrita ${project.id}`}
                onPress={() => onChoose(project.rhythm)}
              >
                Praticar
              </Button>
              <Button
                label={`Remover escrita ${project.id}`}
                onPress={() => void projects.remove(project.id).catch(() => {})}
              >
                Remover
              </Button>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
const title = { color: T.ivory, fontFamily: fonts.serif, fontSize: 38 };
const body = {
  color: T.muted,
  fontFamily: fonts.text,
  fontSize: 14,
  lineHeight: 22,
};
const input = {
  borderWidth: 1,
  borderColor: T.line,
  borderRadius: 4,
  padding: 13,
  color: T.ivory,
  fontFamily: fonts.text,
  fontSize: 16,
};
