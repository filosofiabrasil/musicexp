export type JournalFiles = {
  read: (path: string) => Promise<string | null>;
  write: (path: string, content: string) => Promise<void>;
  move: (from: string, to: string) => Promise<void>;
  remove: (path: string) => Promise<void>;
};

/** Serializar chamadas no consumidor. Nunca sobrescrever o último arquivo válido. */
export function journalFiles(files: JournalFiles, path: string) {
  const next = path + ".next";
  const previous = path + ".previous";
  return {
    async read() {
      return (await files.read(path)) ?? (await files.read(previous));
    },
    async write(content: string) {
      // Uma falha de espaço nesta etapa deixa a versão anterior intacta.
      await files.write(next, content);
      const existing = await files.read(path);
      if (existing !== null) {
        await files.remove(previous);
        await files.move(path, previous);
      }
      try {
        await files.move(next, path);
      } catch (error) {
        if (existing !== null) {
          // Se até a restauração falhar, read() recupera o arquivo .previous.
          await files.move(previous, path).catch(() => {});
        }
        throw error;
      }
      // Uma falha ao limpar a cópia antiga não invalida a gravação concluída.
      await files.remove(previous).catch(() => {});
    },
  };
}
