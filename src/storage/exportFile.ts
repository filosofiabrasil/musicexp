import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
export async function exportFile(name: string, content: string, mime: string) {
  if (!FileSystem.cacheDirectory || !(await Sharing.isAvailableAsync()))
    throw new Error(
      "Compartilhamento de arquivos indisponível neste dispositivo.",
    );
  const directory = FileSystem.cacheDirectory + "pandeiro-exports/";
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  const uri = directory + name.replace(/[^a-zA-Z0-9_.-]/g, "_");
  await FileSystem.writeAsStringAsync(uri, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  await Sharing.shareAsync(uri, {
    mimeType: mime.split(";")[0],
    dialogTitle: name,
  });
}
