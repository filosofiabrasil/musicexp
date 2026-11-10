import React, { useState } from "react";
import { Linking, Text, View, useWindowDimensions } from "react-native";
import { usePractice } from "../hooks/usePractice";
import { StrokeCode, STROKES, THEME as T } from "../pandeiro-ui-base/types";
import {
  SOUND_BANK,
  PLAYBACK_RATE,
  soundVariant,
} from "../audio/sampleLibrary";
import {
  TECHNIQUE_ORDER,
  TECHNIQUES,
  NOTATION_NOTE,
} from "../music/techniques";
import { Button, Label, Separator, fonts } from "./ui";
export function SoundAtlas({
  practice,
}: {
  practice: ReturnType<typeof usePractice>;
}) {
  const [code, setCode] = useState<StrokeCode>("P"),
    { width } = useWindowDimensions();
  const stroke = STROKES[code],
    technique = TECHNIQUES[code],
    variants = SOUND_BANK[stroke.kind],
    chosen = soundVariant(stroke.kind, practice.sampleChoices[stroke.kind]);
  return (
    <View style={{ gap: 24 }}>
      <View style={{ gap: 8 }}>
        <Label orange>ATLAS DE ARTICULAÇÕES E ESCUTA</Label>
        <Text style={{ color: T.ivory, fontFamily: fonts.serif, fontSize: 38 }}>
          Um vocabulário sonoro explícito.
        </Text>
        <Text style={body}>
          43 gravações isoladas, organizadas em nove famílias. Compare amostras
          e escolha a referência de cada articulação. Pré-escuta pausa a tomada
          e não registra um golpe.
        </Text>
      </View>
      <View style={{ flexDirection: width >= 900 ? "row" : "column", gap: 22 }}>
        <View style={{ width: width >= 900 ? 250 : "100%", gap: 8 }}>
          {TECHNIQUE_ORDER.map((c) => (
            <Button
              key={c}
              active={c === code}
              label={`Estudar articulação ${c}`}
              onPress={() => setCode(c)}
            >
              {c} · {STROKES[c].name}
            </Button>
          ))}
        </View>
        <View
          style={{
            flex: 1,
            gap: 18,
            borderWidth: 1,
            borderColor: T.line,
            backgroundColor: T.panel,
            padding: 22,
            borderRadius: 6,
          }}
        >
          <Label orange>{technique.family.toUpperCase()}</Label>
          <Text
            style={{ color: T.ivory, fontFamily: fonts.serif, fontSize: 34 }}
          >
            {code} — {stroke.name}
          </Text>
          <Text style={body}>{technique.contact}</Text>
          <Separator />
          <Label>QUESTÃO DE ESCUTA</Label>
          <Text style={body}>{technique.listen}</Text>
          <Text style={body}>{technique.distinction}</Text>
          <Label>{technique.status.toUpperCase()}</Label>
          <Separator />
          <Label>
            AMOSTRAS · MONO / {(PLAYBACK_RATE / 1000).toLocaleString("pt-BR")}{" "}
            kHz
          </Label>
          {variants.map((variant, index) => (
            <View
              key={variant.id}
              style={{
                gap: 9,
                padding: 12,
                borderWidth: 1,
                borderColor: chosen.id === variant.id ? T.orange : T.line,
                borderRadius: 4,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <Text style={{ ...body, flex: 1, fontSize: 13 }}>
                  {String(index + 1).padStart(2, "0")} · {variant.file}
                </Text>
                <Label>{variant.durationMs} ms</Label>
              </View>
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                <Button
                  disabled={practice.source === "mic" || practice.micBusy}
                  label={`Ouvir amostra ${variant.id}`}
                  onPress={() =>
                    void practice.audition(stroke.kind, variant.id)
                  }
                >
                  ▶ Ouvir
                </Button>
                <Button
                  active={chosen.id === variant.id}
                  label={`Usar amostra ${variant.id}`}
                  onPress={() =>
                    practice.setSampleChoice(stroke.kind, variant.id)
                  }
                >
                  {chosen.id === variant.id
                    ? "Referência selecionada"
                    : "Usar no estudo"}
                </Button>
              </View>
            </View>
          ))}
          {practice.source === "mic" && (
            <Text style={{ ...body, color: T.orange }}>
              Encerre a captura para usar a pré-escuta. Isso evita que o som de
              referência entre no microfone.
            </Text>
          )}
          <Text style={body}>
            O ganho de reprodução é relativo; não corresponde a intensidade
            acústica calibrada. A análise usa referências separadas em 16 kHz. O
            arquivo longo a.m4a não participa do banco de golpes.
          </Text>
        </View>
      </View>
      <View
        style={{
          gap: 12,
          padding: 22,
          borderWidth: 1,
          borderColor: T.line,
          borderRadius: 6,
        }}
      >
        <Label>NOTAÇÃO, FONTES E LIMITES</Label>
        <Text style={body}>{NOTATION_NOTE}</Text>
        <Text style={body}>
          O estudo de leitura, subdivisão, acentos e registro de tomadas pode
          apoiar a prática de percussão de concerto. Os ritmos tradicionais
          preservam seus contextos; os estudos novos são propostas didáticas do
          projeto, não transcrições de obras.
        </Text>
        <Text style={body}>
          Referência bibliográfica: GIANESELLA, Eduardo F. O Uso Idiomático dos
          Instrumentos de Percussão Brasileiros: principais sistemas notacionais
          para o pandeiro brasileiro. Música Hodie, v. 12, 2012. Metadados
          conferidos na página da revista; os símbolos deste app são próprios.
        </Text>
        <Button
          onPress={() =>
            void Linking.openURL(
              "https://revistas.ufg.br/musica/article/view/23359",
            )
          }
        >
          Abrir referência na revista ↗
        </Button>
      </View>
    </View>
  );
}
const body = {
  color: T.muted,
  fontFamily: fonts.text,
  fontSize: 15,
  lineHeight: 23,
};
