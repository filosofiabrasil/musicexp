export async function wavSource(
  bytes: Uint8Array,
): Promise<{ uri: string; dispose: () => void }> {
  const uri = URL.createObjectURL(
    new Blob([new Uint8Array(bytes).buffer], { type: "audio/wav" }),
  );
  return { uri, dispose: () => URL.revokeObjectURL(uri) };
}
