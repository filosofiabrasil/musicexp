import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { Kind } from "../src/pandeiro-ui-base/types";
import { wavBytes } from "../src/audio/pcm";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rate = 44100;
const mapping: [RegExp, Kind][] = [
  [/^GRAVESOLTO/, "grave"],
  [/^GRAVEABAFADO/, "abafado"],
  [/^GRAVES?DEDOS/, "graveDedos"],
  [/^DEDOS/, "dedos"],
  [/^PUNHO/, "punho"],
  [/^TAPAPOLEGAR/, "tapaPolegar"],
  [/^TAPA/, "tapa"],
  [/^MEDIO/, "medio"],
  [/^RULO/, "rulo"],
];
const sounds: Record<string, object[]> = {};
const assets: string[] = [];
const metadata: object[] = [];
fs.mkdirSync(path.join(root, "assets/kit-44100"), { recursive: true });
for (const file of fs.readdirSync(path.join(root, "assets/samples")).sort()) {
  const kind = mapping.find(([re]) => re.test(file))?.[1];
  if (!kind || !file.endsWith(".m4a")) continue;
  const raw = execFileSync("ffmpeg", [
    "-v",
    "error",
    "-i",
    path.join(root, "assets/samples", file),
    "-f",
    "s16le",
    "-ac",
    "1",
    "-ar",
    String(rate),
    "-",
  ]);
  const all = Float32Array.from(
    { length: raw.length / 2 },
    (_, i) => raw.readInt16LE(i * 2) / 32768,
  );
  const peak = all.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
  const start = Math.max(
    0,
    all.findIndex((v) => Math.abs(v) > peak * 0.03) - 44,
  );
  const pcm = all.slice(start);
  for (let i = 0; i < pcm.length; i++)
    pcm[i] =
      (pcm[i] / Math.max(0.001, peak)) *
      0.8 *
      Math.max(0, Math.min(1, (pcm.length - 1 - i) / (rate * 0.012)));
  const id = path.basename(file, ".m4a");
  const bytes = Buffer.alloc(pcm.length * 2);
  pcm.forEach((v, i) => bytes.writeInt16LE(Math.round(v * 32767), i * 2));
  const info = {
    id,
    file,
    kind,
    frames: pcm.length,
    durationMs: Math.round((pcm.length / rate) * 1000),
    trimMs: Math.round((start / rate) * 1000),
    sourceFrames: all.length,
  };
  (sounds[kind] ||= []).push({ ...info, pcm: bytes.toString("base64") });
  metadata.push(info);
  fs.writeFileSync(
    path.join(root, "assets/kit-44100", id + ".wav"),
    wavBytes(pcm, rate),
  );
  assets.push(
    `${JSON.stringify(id)}: require(${JSON.stringify(`../../assets/kit-44100/${id}.wav`)}),`,
  );
}
fs.writeFileSync(
  path.join(root, "src/data/playback.json"),
  JSON.stringify({ rate, sounds }),
);
fs.writeFileSync(
  path.join(root, "src/data/sound-catalog.json"),
  JSON.stringify(
    {
      rate,
      normalization: "Pico de referência 0,8; ganho não corresponde a dB SPL.",
      excluded: [
        {
          file: "a.m4a",
          reason: "Gravação longa, sem identificação de golpe isolado.",
        },
      ],
      samples: metadata,
    },
    null,
    2,
  ) + "\n",
);
fs.writeFileSync(
  path.join(root, "src/data/sampleAssets.ts"),
  `// Gerado por tools/build-playback.ts.\nexport const SAMPLE_ASSETS: Record<string, number> = {\n${assets.join("\n")}\n};\n`,
);
console.log(
  `Reprodução: ${metadata.length} samples, ${Object.keys(sounds).length} famílias, ${rate} Hz. Análise permanece separada em 16 kHz.`,
);
