import React, { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { useJournal } from "../hooks/useJournal";
import { exportFile } from "../storage/exportFile";
import { SessionExport, sessionCsv } from "../study/records";
import { THEME as T } from "../pandeiro-ui-base/types";
import { Button, Label, fonts } from "./ui";
import { TakeComparison } from "./TakeComparison";
import { PROGRAMS } from "../music/program";
export function StudyJournal({
  journal,
  notes,
  setNotes,
  session,
  onSave,
  savedMessage,
  exportError,
}: {
  journal: ReturnType<typeof useJournal>;
  notes: string;
  setNotes: (text: string) => void;
  session: () => SessionExport;
  onSave: () => void;
  savedMessage: string;
  exportError: (message: string) => void;
}) {
  const [compared, setCompared] = useState<string[]>([]);
  const current = session();
  const download = async (format: "json" | "csv") => {
    try {
      const data = session();
      await exportFile(
        `pandeiro-tomada-${data.record.id}.${format}`,
        format === "json" ? JSON.stringify(data, null, 2) : sessionCsv(data),
        format === "json" ? "application/json" : "text/csv;charset=utf-8",
      );
    } catch (e) {
      exportError(
        e instanceof Error ? e.message : "Não foi possível exportar.",
      );
    }
  };
  return (
    <View style={{ gap: 24 }}>
      <View style={{ gap: 8 }}>
        <Label orange>CADERNO DE ESTUDO E DADOS</Label>
        <Text style={title}>Registrar, comparar, refletir.</Text>
        <Text style={body}>
          O caderno guarda até 50 resumos neste dispositivo. A exportação da
          tomada atual inclui os eventos individuais com unidades explícitas,
          para análise externa. Não há sincronização em nuvem.
        </Text>
      </View>
      <View style={card}>
        <Label>TOMADA ATUAL</Label>
        <Text style={{ ...title, fontSize: 28 }}>{current.record.title}</Text>
        <TextInput
          accessibilityLabel="Observações da tomada"
          multiline
          value={notes}
          onChangeText={setNotes}
          maxLength={3000}
          placeholder="Objetivo, dificuldades, escolha de articulação, hipótese para a próxima tomada…"
          placeholderTextColor={T.muted}
          style={{
            minHeight: 110,
            textAlignVertical: "top",
            borderWidth: 1,
            borderColor: T.line,
            padding: 14,
            color: T.ivory,
            fontFamily: fonts.text,
            fontSize: 15,
          }}
        />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <Button
            primary
            disabled={!journal.loaded || !current.hits.length}
            onPress={onSave}
          >
            Registrar tomada
          </Button>
          <Button
            label="Exportar tomada JSON"
            onPress={() => void download("json")}
          >
            Exportar JSON
          </Button>
          <Button
            label="Exportar golpes CSV"
            onPress={() => void download("csv")}
          >
            Golpes em CSV
          </Button>
        </View>
        {!!savedMessage && (
          <Text
            accessibilityLiveRegion="polite"
            style={{ ...body, color: T.orange }}
          >
            {savedMessage}
          </Text>
        )}
        <Text style={body}>
          JSON inclui contexto, configuração, fontes, observações e golpes. CSV
          contém um golpe por linha, com t e nominal em segundos e erro em ms. O
          índice do classificador é heurístico, não uma probabilidade de acerto.
        </Text>
      </View>
      {!!journal.error && (
        <Text accessibilityRole="alert" style={{ ...body, color: T.orange }}>
          {journal.error}
        </Text>
      )}
      {journal.rawBackup !== null && (
        <Button
          onPress={() =>
            void exportFile(
              "pandeiro-caderno-recuperacao.txt",
              journal.rawBackup!,
              "text/plain",
            ).catch(() =>
              exportError("Não foi possível exportar a cópia de recuperação."),
            )
          }
        >
          Exportar dados preservados
        </Button>
      )}
      {journal.lastRemoved && (
        <View style={{ gap: 8 }}>
          <Text style={body}>
            Registro removido: {journal.lastRemoved.title}
          </Text>
          <Button
            label="Desfazer remoção"
            onPress={() => void journal.undo().catch(() => {})}
          >
            Desfazer remoção
          </Button>
        </View>
      )}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <Label>
          {journal.records.length}{" "}
          {journal.records.length === 1
            ? "TOMADA REGISTRADA"
            : "TOMADAS REGISTRADAS"}
        </Label>
        <Button
          disabled={!journal.records.length}
          onPress={() =>
            void exportFile(
              "pandeiro-caderno.json",
              JSON.stringify(
                { schemaVersion: 1, records: journal.records },
                null,
                2,
              ),
              "application/json",
            ).catch(() => exportError("Não foi possível exportar o caderno."))
          }
        >
          Exportar caderno
        </Button>
      </View>
      {!journal.records.length && (
        <Text style={body}>
          Ainda não há registros. Faça uma tomada na área Prática e registre o
          resultado aqui.
        </Text>
      )}
      {journal.records.map((record) => (
        <View key={record.id} style={card}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <Text
              style={{ color: T.ivory, fontFamily: fonts.text, fontSize: 20 }}
            >
              {record.title}
            </Text>
            <Label>{new Date(record.createdAt).toLocaleString("pt-BR")}</Label>
          </View>
          <Text style={body}>
            ♩ = {record.settings.bpm} · {record.settings.subdivision}{" "}
            unidades/semínima ·{" "}
            {record.settings.source === "mic"
              ? "microfone experimental"
              : "pads/teclado"}{" "}
            · janela ±{record.settings.tolerance} ms
          </Text>
          <Text
            style={{ color: T.silver, fontFamily: fonts.mono, fontSize: 12 }}
          >
            {record.sequence}
          </Text>
          <Text style={body}>
            {record.metrics.correct}/{record.metrics.expected} posições corretas
            · erro médio absoluto {record.metrics.mae.toFixed(1)} ms · σ{" "}
            {record.metrics.std.toFixed(1)} ms · {record.metrics.count} golpes
          </Text>
          {!!record.settings.goal && (
            <Text style={body}>Intenção: {record.settings.goal}</Text>
          )}
          <Text style={body}>
            {
              PROGRAMS.find(
                (program) => program.id === (record.settings.program ?? "free"),
              )?.name
            }{" "}
            · {record.settings.meter ?? "sem fórmula declarada"} ·{" "}
            {record.elapsed.toFixed(1)} s
          </Text>
          {!!record.notes && (
            <Text style={{ ...body, color: T.ivory }}>{record.notes}</Text>
          )}
          <Button
            label={`Comparar tomada ${record.id}`}
            active={compared.includes(record.id)}
            onPress={() =>
              setCompared((current) =>
                current.includes(record.id)
                  ? current.filter((id) => id !== record.id)
                  : [...current.slice(-1), record.id],
              )
            }
          >
            {compared.includes(record.id)
              ? "Selecionada para comparar"
              : "Selecionar para comparar"}
          </Button>
          <Button
            label={`Remover tomada ${record.id}`}
            onPress={() => void journal.remove(record.id).catch(() => {})}
          >
            Remover este registro
          </Button>
        </View>
      ))}
      <TakeComparison
        records={journal.records.filter((record) =>
          compared.includes(record.id),
        )}
      />
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
const card = {
  gap: 14,
  padding: 22,
  borderWidth: 1,
  borderColor: T.line,
  borderRadius: 5,
  backgroundColor: T.panel,
};
