import { useEffect, useRef, useState } from "react";
import { readJournal, writeJournal } from "../storage/journal";
import { JOURNAL_LIMIT, StudyRecord, parseJournal } from "../study/records";
export function useJournal() {
  const [records, setRecords] = useState<StudyRecord[]>([]),
    [loaded, setLoaded] = useState(false),
    [error, setError] = useState("");
  const [lastRemoved, setLastRemoved] = useState<StudyRecord | null>(null),
    [rawBackup, setRawBackup] = useState<string | null>(null);
  const current = useRef<StudyRecord[]>([]),
    queue = useRef(Promise.resolve());
  useEffect(() => {
    let cancelled = false;
    readJournal()
      .then((raw) => {
        let parsed: StudyRecord[];
        try {
          parsed = parseJournal(raw);
        } catch (e) {
          if (!cancelled) setRawBackup(raw);
          throw e;
        }
        if (!cancelled) {
          current.current = parsed;
          setRecords(parsed);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled)
          setError(
            "Caderno indisponível ou ilegível. Os dados existentes foram preservados; a prática continua disponível.",
          );
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const update = (change: (rows: StudyRecord[]) => StudyRecord[]) => {
    const next = queue.current.then(async () => {
      if (!loaded) throw new Error("O caderno ainda não está disponível.");
      const rows = change(current.current);
      if (rows.length > JOURNAL_LIMIT)
        throw new Error(
          "O caderno tem 50 tomadas. Exporte e remova uma antes de salvar outra.",
        );
      await writeJournal(JSON.stringify(rows));
      current.current = rows;
      setRecords(rows);
      setError("");
    });
    queue.current = next.catch(() => {});
    return next.catch((e) => {
      const message =
        e instanceof Error && e.name === "QuotaExceededError"
          ? "Armazenamento do caderno cheio. Exporte os registros antes de remover algum. Nenhum registro foi apagado."
          : e instanceof Error
            ? e.message
            : "Não foi possível salvar. Nenhum registro foi apagado.";
      setError(message);
      throw new Error(message);
    });
  };
  const remove = async (id: string) => {
    let removed: StudyRecord | undefined;
    await update((rows) => {
      removed = rows.find((row) => row.id === id);
      return rows.filter((row) => row.id !== id);
    });
    if (removed) setLastRemoved(removed);
  };
  const undo = async () => {
    if (!lastRemoved) return;
    await update((rows) => [
      lastRemoved,
      ...rows.filter((row) => row.id !== lastRemoved.id),
    ]);
    setLastRemoved(null);
  };
  return {
    records,
    loaded,
    error,
    rawBackup,
    lastRemoved,
    undo,
    add: (record: StudyRecord) =>
      update((rows) => [record, ...rows.filter((row) => row.id !== record.id)]),
    remove,
  };
}
