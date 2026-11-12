import React, { useState, useRef } from "react";
import { Text, TextInput, View } from "react-native";
import {
  EnsembleScene,
  EnsembleTempo,
  ENSEMBLE_CLIPS,
  ENSEMBLE_RATE,
  clipById,
  defaultBlocks,
  moveBlock,
  parseEnsemble,
} from "../music/ensemble";
import { useEnsemble } from "../hooks/useEnsemble";
import { readEnsemble, writeEnsemble } from "../storage/ensemble";
import { exportFile } from "../storage/exportFile";
import { exportAudio } from "../storage/exportAudio";
import { wavBytes } from "../audio/pcm";
import { THEME as T } from "../pandeiro-ui-base/types";
import { Button, Label, Separator, fonts } from "./ui";
export function EnsembleStudio({
  scene,
  setScene,
}: {
  scene: EnsembleScene;
  setScene: React.Dispatch<React.SetStateAction<EnsembleScene>>;
}) {
  const operation = useRef(false);
  const practice = useEnsemble(scene),
    [message, setMessage] = useState(""),
    [saving, setSaving] = useState(false);
  const update = (patch: Partial<EnsembleScene>) => {
    try {
      const next = parseEnsemble(JSON.stringify({ ...scene, ...patch }));
      setScene(next);
      setMessage("");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Montagem inválida.");
    }
  };
  const tempo = (bpm: EnsembleTempo) =>
    update({ bpm, blocks: defaultBlocks(bpm) });
  const model = scene.mode === "chair" ? scene.chairGuide : scene.dominoGuide;
  const setModel = (value: boolean) =>
    update(
      scene.mode === "chair" ? { chairGuide: value } : { dominoGuide: value },
    );
  const perform = async (job: () => Promise<void>) => {
    if (operation.current) return;
    operation.current = true;
    setSaving(true);
    try {
      await job();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Operação indisponível.");
    } finally {
      operation.current = false;
      setSaving(false);
    }
  };
  const colors: Record<string, string> = {
    surdo: T.kind.grave,
    agogo: T.kind.tapa,
    reco: T.kind.punho,
    pandeiro: T.kind.dedos,
  };
  const pct = Math.min(
    100,
    Math.max(0, (practice.beat / practice.rendered.beats) * 100),
  );
  return (
    <View style={{ gap: 22 }}>
      <View style={row}>
        <Button
          active={scene.mode === "chair"}
          label="Modo Cadeira vazia"
          onPress={() => update({ mode: "chair" })}
        >
          Cadeira vazia
        </Button>
        <Button
          active={scene.mode === "domino"}
          label="Modo Dominó de frases"
          onPress={() => update({ mode: "domino" })}
        >
          Dominó de frases
        </Button>
      </View>
      <View style={{ gap: 9 }}>
        <Label orange>TOCAR EM CONJUNTO · COMPOR COM O OUVIDO</Label>
        <Text accessibilityRole="header" style={title}>
          {scene.mode === "chair"
            ? "O lugar do pandeiro é seu."
            : "Uma frase leva à próxima."}
        </Text>
        <Text style={body}>
          {scene.mode === "chair"
            ? "Ouça a base, entre depois de quatro pulsos e sustente sua levada. Ative o modelo quando quiser uma referência."
            : "Monte uma sequência com gravações de levadas, viradas e finais. Escute a montagem e depois desligue o modelo para tocar sua versão sobre a mesma base."}
        </Text>
      </View>
      {!!message && (
        <Text
          accessibilityLiveRegion="polite"
          style={{ ...body, color: T.orange }}
        >
          {message}
        </Text>
      )}
      <View style={panel}>
        <View style={row}>
          <Label>BASE E ANDAMENTO</Label>
          {([84, 92] as const).map((bpm) => (
            <Button
              key={bpm}
              active={scene.bpm === bpm}
              label={`Base ${bpm} BPM`}
              onPress={() => tempo(bpm)}
            >
              {bpm} BPM
            </Button>
          ))}
        </View>
        <Text style={small}>
          84 BPM: surdo. 92 BPM: surdo, agogô e reco-reco. Trocar a base abre
          uma sequência inicial no novo andamento.
        </Text>
        <View style={row}>
          {(scene.bpm === 84
            ? ["surdo", "pandeiro"]
            : ["surdo", "agogo", "reco", "pandeiro"]
          ).map((name) => {
            const key = name as keyof EnsembleScene["levels"];
            const label = (
              {
                surdo: "Surdo",
                agogo: "Agogô",
                reco: "Reco-reco",
                pandeiro: "Pandeiro",
              } as const
            )[key];
            const empty = key === "pandeiro" && !model;
            return (
              <View
                key={key}
                style={{ ...seat, borderColor: empty ? T.orange : colors[key] }}
              >
                <Label orange={empty}>
                  {empty ? "CADEIRA VAZIA" : "NA RODA"}
                </Label>
                <Text style={{ ...title, fontSize: 27, color: colors[key] }}>
                  {label}
                </Text>
                <Text style={small}>
                  {empty ? "Entre com seu instrumento." : "Nível da gravação"}
                </Text>
                {key === "pandeiro" && (
                  <Button
                    active={model}
                    label="Ouvir modelo de pandeiro"
                    onPress={() => setModel(!model)}
                  >
                    {model ? "Modelo ligado" : "Ouvir modelo"}
                  </Button>
                )}
                <View style={row}>
                  {[0, 0.25, 0.5, 0.75, 1].map((level) => (
                    <Button
                      key={level}
                      style={{ paddingHorizontal: 8 }}
                      disabled={empty}
                      active={scene.levels[key] === level}
                      label={`${label} ${level * 100}%`}
                      onPress={() =>
                        update({ levels: { ...scene.levels, [key]: level } })
                      }
                    >
                      {level * 100}
                    </Button>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
        <View style={row}>
          <Button
            active={scene.click}
            label="Clique da roda"
            onPress={() => update({ click: !scene.click })}
          >
            Clique {scene.click ? "ligado" : "desligado"}
          </Button>
          <Button
            active={scene.countIn}
            label="Preparação da roda"
            onPress={() => update({ countIn: !scene.countIn })}
          >
            Preparação {scene.countIn ? "4 pulsos" : "desligada"}
          </Button>
        </View>
        <Text style={small}>
          O clique marca semínimas. Os andamentos são os das gravações
          preparadas. Alterar a montagem pausa e volta ao início.
        </Text>
      </View>
      {scene.mode === "chair" ? (
        <View style={panel}>
          <Label>DURAÇÃO DA PRÁTICA</Label>
          <View style={row}>
            {[1, 2, 4, 8].map((cycles) => (
              <Button
                key={cycles}
                active={scene.cycles === cycles}
                label={`Praticar ${cycles * 4} pulsos`}
                onPress={() => update({ cycles })}
              >
                {cycles * 4} pulsos
              </Button>
            ))}
          </View>
          <Text style={body}>
            Primeiro toque apenas a base de sua levada. Na próxima tomada,
            acrescente uma variação e termine junto com a roda.
          </Text>
        </View>
      ) : (
        <View style={panel}>
          <Label orange>SUAS PEÇAS · ATÉ 12 PEÇAS E 64 PULSOS</Label>
          <View style={{ gap: 10 }}>
            {scene.blocks.map((block, index) => {
              const clip = clipById(block.clipId),
                active = practice.running && practice.cue?.index === index;
              return (
                <View
                  key={index}
                  testID={`phrase-block-${index}`}
                  style={{
                    padding: 15,
                    gap: 9,
                    backgroundColor: active ? "#302113" : T.black,
                    borderWidth: 1,
                    borderColor: active ? T.orange : T.line,
                    borderRadius: 5,
                  }}
                >
                  <Label orange={active}>
                    PEÇA {index + 1} · {clip.role.toUpperCase()} ·{" "}
                    {clip.beats * block.repeats} PULSOS
                  </Label>
                  <Text style={{ ...title, fontSize: 26 }}>{clip.title}</Text>
                  <View style={row}>
                    <Button
                      disabled={index === 0}
                      label={`Mover peça ${index + 1} para antes`}
                      onPress={() =>
                        update({ blocks: moveBlock(scene.blocks, index, -1) })
                      }
                    >
                      ←
                    </Button>
                    <Button
                      disabled={index === scene.blocks.length - 1}
                      label={`Mover peça ${index + 1} para depois`}
                      onPress={() =>
                        update({ blocks: moveBlock(scene.blocks, index, 1) })
                      }
                    >
                      →
                    </Button>
                    <Button
                      disabled={block.repeats === 1}
                      label={`Diminuir repetições da peça ${index + 1}`}
                      onPress={() =>
                        update({
                          blocks: scene.blocks.map((b, i) =>
                            i === index ? { ...b, repeats: b.repeats - 1 } : b,
                          ),
                        })
                      }
                    >
                      −
                    </Button>
                    <Text style={body}>{block.repeats}×</Text>
                    <Button
                      disabled={block.repeats === 8}
                      label={`Aumentar repetições da peça ${index + 1}`}
                      onPress={() =>
                        update({
                          blocks: scene.blocks.map((b, i) =>
                            i === index ? { ...b, repeats: b.repeats + 1 } : b,
                          ),
                        })
                      }
                    >
                      +
                    </Button>
                    <Button
                      disabled={scene.blocks.length === 1}
                      label={`Remover peça ${index + 1}`}
                      onPress={() =>
                        update({
                          blocks: scene.blocks.filter((_, i) => i !== index),
                        })
                      }
                    >
                      Remover
                    </Button>
                  </View>
                </View>
              );
            })}
          </View>
          <Label>ACRESCENTAR UMA PEÇA</Label>
          <View style={row}>
            {ENSEMBLE_CLIPS.filter(
              (c) => c.bpm === scene.bpm && c.instrument === "pandeiro",
            ).map((clip) => (
              <Button
                key={clip.id}
                disabled={scene.blocks.length >= 12}
                label={`Adicionar ${clip.title}`}
                onPress={() =>
                  update({
                    blocks: [...scene.blocks, { clipId: clip.id, repeats: 1 }],
                  })
                }
              >
                {clip.title} · {clip.beats} pulsos
              </Button>
            ))}
          </View>
          <Text style={small}>
            As peças representam trechos gravados, com contagens dos metadados.
            Os finais podem incluir ressonância; sua posição é uma escolha de
            composição. A virada de contagem ambígua ficou fora desta seleção.
          </Text>
        </View>
      )}
      <View style={panel} testID="ensemble-transport">
        <Label orange>
          {practice.rendered.beats} PULSOS ·{" "}
          {practice.rendered.targetDuration.toFixed(1)} s +{" "}
          {scene.countIn ? "4 pulsos de preparação" : "sem preparação"}
        </Label>
        <Text
          accessibilityLiveRegion="polite"
          testID="ensemble-stage"
          style={{ ...title, fontSize: 29 }}
        >
          {practice.finished
            ? "Montagem concluída"
            : practice.time < 0
              ? `Preparação · ${Math.max(1, Math.ceil((-practice.time * scene.bpm) / 60))}`
              : practice.running
                ? `${scene.mode === "chair" && !model ? "Sua vez" : (practice.cue?.title ?? "Tocando")} · pulso ${Math.min(practice.rendered.beats, Math.floor(practice.beat) + 1)}`
                : "Pronto para tocar"}
        </Text>
        <View
          accessibilityRole="progressbar"
          accessibilityLabel="Progresso da montagem"
          accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}
          style={{ height: 6, backgroundColor: T.line, borderRadius: 3 }}
        >
          <View
            style={{
              height: 6,
              width: `${pct}%`,
              backgroundColor: T.orange,
              borderRadius: 3,
            }}
          />
        </View>
        <View style={row}>
          <Button
            primary
            disabled={!practice.ready || practice.busy}
            label={practice.running ? "Pausar montagem" : "Tocar montagem"}
            onPress={() => void practice.toggle()}
          >
            {practice.busy
              ? "Iniciando…"
              : !practice.ready
                ? "Preparando…"
                : practice.running
                  ? "Ⅱ Pausar"
                  : practice.finished
                    ? "Tocar novamente"
                    : "▶ Tocar"}
          </Button>
          <Button
            disabled={!practice.ready || practice.busy}
            label="Reiniciar montagem"
            onPress={practice.restart}
          >
            Voltar ao início
          </Button>
        </View>
        <Text style={small}>
          Preparação, base, modelo e clique saem do mesmo áudio. A tomada
          termina automaticamente. Nesta sala, você pratica pela escuta; não há
          pontuação automática dos golpes.
        </Text>
        {!!practice.error && (
          <Text accessibilityRole="alert" style={{ ...body, color: T.orange }}>
            {practice.error}
          </Text>
        )}
      </View>
      <View style={panel}>
        <Label>CONSERVAR SUA MONTAGEM</Label>
        <TextInput
          accessibilityLabel="Nome da montagem"
          value={scene.title}
          onChangeText={(title) => update({ title })}
          maxLength={80}
          style={{
            padding: 12,
            borderWidth: 1,
            borderColor: T.line,
            color: T.ivory,
            fontFamily: fonts.text,
            fontSize: 16,
            borderRadius: 5,
          }}
        />
        <View style={row}>
          <Button
            disabled={saving}
            label="Salvar montagem"
            onPress={() =>
              void perform(async () => {
                await writeEnsemble(JSON.stringify(scene));
                setMessage("Montagem salva neste dispositivo.");
              })
            }
          >
            Salvar montagem
          </Button>
          <Button
            disabled={saving}
            label="Abrir montagem salva"
            onPress={() =>
              void perform(async () => {
                const raw = await readEnsemble();
                if (!raw) throw new Error("Ainda não há montagem salva.");
                setScene(parseEnsemble(raw));
                setMessage("Montagem recuperada.");
              })
            }
          >
            Abrir salva
          </Button>
          <Button
            disabled={saving}
            label="Exportar montagem JSON"
            onPress={() =>
              void perform(async () => {
                await exportFile(
                  "pandeiro-montagem.json",
                  JSON.stringify(
                    {
                      bankVersion: 1,
                      scene,
                      cues: practice.rendered.cues,
                      events: practice.rendered.events,
                      rate: ENSEMBLE_RATE,
                      masterGain: practice.rendered.masterGain,
                      clips: ENSEMBLE_CLIPS.filter((c) =>
                        practice.rendered.events.some((e) => e.clipId === c.id),
                      ).map(({ id, source, pcmSha256 }) => ({
                        id,
                        source,
                        pcmSha256,
                      })),
                    },
                    null,
                    2,
                  ),
                  "application/json",
                );
                setMessage("Montagem exportada.");
              })
            }
          >
            Exportar roteiro
          </Button>
          <Button
            disabled={saving}
            label="Exportar montagem WAV"
            onPress={() =>
              void perform(async () => {
                await exportAudio(
                  "pandeiro-montagem.wav",
                  wavBytes(practice.rendered.pcm, ENSEMBLE_RATE),
                );
                setMessage(
                  "Áudio exportado com as camadas e a preparação escolhidas.",
                );
              })
            }
          >
            Exportar áudio WAV
          </Button>
        </View>
        <Text style={small}>
          Salvar substitui a montagem salva anterior; exporte versões que queira
          conservar. O áudio exportado contém a base e o modelo escolhido, sem
          gravar sua execução ao vivo.
        </Text>
      </View>
      <Separator />
      <Text style={small}>
        Banco inicial: 14 trechos do acervo enviado, preparados para 84 e 92
        BPM. Créditos dos metadados: Música e Áudio · Percussão Brasileira ·
        Caetano Salles. As posições dos ataques internos não foram quantizadas;
        não se trata de uma transcrição de partitura.
      </Text>
    </View>
  );
}
const row = {
  flexDirection: "row" as const,
  flexWrap: "wrap" as const,
  gap: 8,
  alignItems: "center" as const,
};
const panel = {
  padding: 20,
  gap: 16,
  backgroundColor: T.panel,
  borderWidth: 1,
  borderColor: T.line,
  borderRadius: 7,
};
const seat = {
  flexGrow: 1,
  flexBasis: 230,
  padding: 16,
  gap: 12,
  borderWidth: 1,
  borderRadius: 6,
};
const title = { color: T.ivory, fontFamily: fonts.serif, fontSize: 38 };
const body = {
  color: T.silver,
  fontFamily: fonts.text,
  fontSize: 14,
  lineHeight: 22,
};
const small = {
  color: T.muted,
  fontFamily: fonts.text,
  fontSize: 12,
  lineHeight: 19,
};
