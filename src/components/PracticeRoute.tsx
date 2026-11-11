import React from "react";
import { Text, TextInput, View } from "react-native";
import { usePractice } from "../hooks/usePractice";
import { PROGRAMS, programPlan, programStage } from "../music/program";
import { THEME as T } from "../pandeiro-ui-base/types";
import { Button, Label, fonts } from "./ui";
export function PracticeRoute({
  practice,
  goal,
  setGoal,
}: {
  practice: ReturnType<typeof usePractice>;
  goal: string;
  setGoal: (text: string) => void;
}) {
  const description = PROGRAMS.find((p) => p.id === practice.program)!;
  const total = programPlan(practice.program).cycles;
  const elapsed = Math.max(0, practice.clock.t);
  const progress = total
    ? Math.min(1, elapsed / (practice.clock.bar * total))
    : 0;
  return (
    <View
      style={{
        gap: 14,
        padding: 18,
        borderWidth: 1,
        borderColor: T.line,
        borderRadius: 6,
        backgroundColor: T.panel,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <Label orange>UMA PERGUNTA, UMA TOMADA</Label>
        <Label>LER → OUVIR → TOCAR → COMPARAR</Label>
      </View>
      <TextInput
        accessibilityLabel="Objetivo do estudo"
        value={goal}
        onChangeText={setGoal}
        placeholder="O que vou investigar? Ex.: manter D–B regular quando o clique some."
        placeholderTextColor={T.muted}
        maxLength={500}
        multiline
        style={{
          color: T.ivory,
          fontFamily: fonts.text,
          fontSize: 14,
          lineHeight: 21,
          minHeight: 65,
          padding: 12,
          borderWidth: 1,
          borderColor: T.line,
          borderRadius: 4,
        }}
      />
      <View style={{ flexDirection: "row", gap: 7, flexWrap: "wrap" }}>
        {PROGRAMS.map((program) => (
          <Button
            key={program.id}
            active={practice.program === program.id}
            label={`Programa ${program.name}`}
            onPress={() => practice.setProgram(program.id)}
          >
            {program.name}
          </Button>
        ))}
      </View>
      <Text
        style={{
          color: T.silver,
          fontFamily: fonts.text,
          fontSize: 13,
          lineHeight: 20,
        }}
      >
        {description.purpose}
      </Text>
      {!!total && (
        <>
          <View
            style={{
              height: 3,
              backgroundColor: T.line,
              opacity: practice.concealed ? 0 : 1,
            }}
          >
            <View
              style={{
                height: 3,
                width: `${progress * 100}%`,
                backgroundColor: T.orange,
              }}
            />
          </View>
          <Text
            accessibilityLiveRegion="polite"
            style={{ color: T.orange, fontFamily: fonts.mono, fontSize: 12 }}
          >
            {practice.concealed
              ? "Sem clique e sem cursor · siga tocando"
              : practice.running || practice.completed
                ? programStage(
                    practice.program,
                    practice.clock.t,
                    practice.bpm,
                    practice.clock.bar,
                  )
                : "Pronto · preparação de 4 semínimas"}
          </Text>
          <Text
            style={{
              color: T.muted,
              fontFamily: fonts.text,
              fontSize: 12,
              lineHeight: 18,
            }}
          >
            A preparação não pontua. No programa Memória, silêncios são parte do
            exercício. O volume de saída controla também a contagem; use fones
            com microfone.
          </Text>
        </>
      )}
    </View>
  );
}
