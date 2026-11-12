export async function exportAudio(name: string, bytes: Uint8Array) {
  const url = URL.createObjectURL(
    new Blob([new Uint8Array(bytes)], { type: "audio/wav" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
