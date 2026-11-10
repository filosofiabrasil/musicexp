import * as FileSystem from "expo-file-system/legacy";
import { toBase64 } from "./pcm";
export async function wavSource(
  bytes: Uint8Array,
): Promise<{ uri: string; dispose: () => void }> {
  const uri = `${FileSystem.cacheDirectory}pandeiro-${Date.now()}-${Math.random().toString(36).slice(2)}.wav`;
  await FileSystem.writeAsStringAsync(uri, toBase64(bytes), {
    encoding: FileSystem.EncodingType.Base64,
  });
  return {
    uri,
    dispose: () => {
      void FileSystem.deleteAsync(uri, { idempotent: true });
    },
  };
}
