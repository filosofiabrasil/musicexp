import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { toBase64 } from "../audio/pcm";
export async function exportAudio(name: string, bytes: Uint8Array) {
  if (!FileSystem.cacheDirectory || !(await Sharing.isAvailableAsync()))
    throw new Error("Compartilhamento indisponível.");
  const uri = FileSystem.cacheDirectory + name.replace(/[^a-zA-Z0-9_.-]/g, "_");
  await FileSystem.writeAsStringAsync(uri, toBase64(bytes), {
    encoding: FileSystem.EncodingType.Base64,
  });
  await Sharing.shareAsync(uri, { mimeType: "audio/wav", dialogTitle: name });
}
