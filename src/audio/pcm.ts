const alphabet =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
export function toBase64(bytes: Uint8Array): string {
  const chunks: string[] = [];
  for (let i = 0; i < bytes.length; i += 3) {
    const n =
      bytes[i] * 65536 + (bytes[i + 1] || 0) * 256 + (bytes[i + 2] || 0);
    chunks.push(
      alphabet[n >>> 18],
      alphabet[(n >>> 12) & 63],
      i + 1 < bytes.length ? alphabet[(n >>> 6) & 63] : "=",
      i + 2 < bytes.length ? alphabet[n & 63] : "=",
    );
  }
  return chunks.join("");
}
export function fromBase64(text: string) {
  const bytes = new Uint8Array(
    (text.length * 3) / 4 -
      (text.endsWith("==") ? 2 : text.endsWith("=") ? 1 : 0),
  );
  let at = 0;
  for (let i = 0; i < text.length; i += 4) {
    const n =
      (alphabet.indexOf(text[i]) << 18) |
      (alphabet.indexOf(text[i + 1]) << 12) |
      ((alphabet.indexOf(text[i + 2]) & 63) << 6) |
      (alphabet.indexOf(text[i + 3]) & 63);
    if (at < bytes.length) bytes[at++] = (n >>> 16) & 255;
    if (at < bytes.length) bytes[at++] = (n >>> 8) & 255;
    if (at < bytes.length) bytes[at++] = n & 255;
  }
  return bytes;
}
export function decodePcm16(text: string): Float32Array {
  const bytes = fromBase64(text),
    view = new DataView(bytes.buffer);
  return Float32Array.from(
    { length: bytes.length / 2 },
    (_, i) => view.getInt16(i * 2, true) / 32768,
  );
}
export function wavBytes(samples: Float32Array, rate: number) {
  const bytes = new Uint8Array(44 + samples.length * 2),
    view = new DataView(bytes.buffer);
  const str = (offset: number, text: string) =>
    [...text].forEach((v, i) => view.setUint8(offset + i, v.charCodeAt(0)));
  str(0, "RIFF");
  view.setUint32(4, bytes.length - 8, true);
  str(8, "WAVE");
  str(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  str(36, "data");
  view.setUint32(40, samples.length * 2, true);
  samples.forEach((s, i) =>
    view.setInt16(
      44 + i * 2,
      Math.round(Math.max(-1, Math.min(1, s)) * 32767),
      true,
    ),
  );
  return bytes;
}
