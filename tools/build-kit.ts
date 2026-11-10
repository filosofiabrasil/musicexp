import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { extractFeatures, TemplateBank } from "../src/audio/dsp";
import { Kind } from "../src/pandeiro-ui-base/types";
import { wavBytes } from "../src/audio/pcm";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
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
const bank: TemplateBank = {},
  kit: Record<string, string> = {};
const rate = 16000;
fs.mkdirSync(path.join(root, "assets/kit"), { recursive: true });
for (const name of fs.readdirSync(path.join(root, "assets/samples")).sort()) {
  const kind = mapping.find(([re]) => re.test(name))?.[1];
  if (!kind || !name.endsWith(".m4a")) continue;
  const raw = execFileSync("ffmpeg", [
    "-v",
    "error",
    "-i",
    path.join(root, "assets/samples", name),
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
  const peak = all.reduce((p, s) => Math.max(p, Math.abs(s)), 0);
  let start = all.findIndex((s) => Math.abs(s) > peak * 0.03);
  start = Math.max(0, start - 16);
  const pcm = all.slice(start, start + rate * 0.5);
  for (let i = 0; i < pcm.length; i++)
    pcm[i] =
      (pcm[i] / Math.max(0.001, peak)) *
      0.8 *
      Math.min(1, (pcm.length - 1 - i) / 192);
  const features = extractFeatures(pcm, rate);
  (bank[kind] ||= []).push(features);
  if (!kit[kind]) {
    const bytes = Buffer.alloc(pcm.length * 2);
    pcm.forEach((s, i) => bytes.writeInt16LE(Math.round(s * 32767), i * 2));
    kit[kind] = bytes.toString("base64");
    fs.writeFileSync(
      path.join(root, "assets/kit", kind + ".wav"),
      wavBytes(pcm, rate),
    );
  }
}
fs.writeFileSync(
  path.join(root, "src/data/kit.json"),
  JSON.stringify({ rate, samples: kit }),
);
fs.writeFileSync(
  path.join(root, "src/data/templates.json"),
  JSON.stringify(bank),
);
console.log(
  `Kit: ${Object.keys(kit).length} timbres. Referências: ${Object.values(bank).reduce((n, b) => n + b!.length, 0)} samples.`,
);
