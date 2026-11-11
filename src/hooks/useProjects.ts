import { useEffect, useRef, useState } from "react";
import { readProjects, writeProjects } from "../storage/projects";
import { parseProjects, WrittenStudy, projectKey } from "../study/projects";
import { Rhythm } from "../pandeiro-ui-base/types";
export function useProjects() {
  const [projects, setProjects] = useState<WrittenStudy[]>([]),
    [loaded, setLoaded] = useState(false),
    [error, setError] = useState("");
  const [removed, setRemoved] = useState<WrittenStudy | null>(null),
    [rawBackup, setRawBackup] = useState<string | null>(null);
  const current = useRef<WrittenStudy[]>([]),
    queue = useRef(Promise.resolve());
  useEffect(() => {
    let cancelled = false;
    readProjects()
      .then((raw) => {
        let rows: WrittenStudy[];
        try {
          rows = parseProjects(raw);
        } catch (e) {
          if (!cancelled) setRawBackup(raw);
          throw e;
        }
        if (!cancelled) {
          current.current = rows;
          setProjects(rows);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled)
          setError(
            "Biblioteca pessoal indisponível ou ilegível. A escrita atual continua disponível; os dados existentes foram preservados.",
          );
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const update = (change: (rows: WrittenStudy[]) => WrittenStudy[]) => {
    const task = queue.current.then(async () => {
      if (!loaded) throw new Error("A biblioteca pessoal não está disponível.");
      const rows = change(current.current);
      if (rows.length > 30)
        throw new Error(
          "Limite de 30 escritas. Exporte e remova uma para continuar.",
        );
      const raw = JSON.stringify(rows);
      parseProjects(raw);
      await writeProjects(raw);
      current.current = rows;
      setProjects(rows);
      setError("");
    });
    queue.current = task.catch(() => {});
    return task.catch((e) => {
      const message =
        e instanceof Error && e.name === "QuotaExceededError"
          ? "Armazenamento cheio. Nenhuma escrita foi apagada."
          : e instanceof Error
            ? e.message
            : "Não foi possível salvar.";
      setError(message);
      throw new Error(message);
    });
  };
  return {
    projects,
    loaded,
    error,
    rawBackup,
    removed,
    save: (rhythm: Rhythm) =>
      update((rows) => {
        const previous = rows.find(
          (row) => projectKey(row.rhythm) === projectKey(rhythm),
        );
        const id =
          previous?.id ??
          `written-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
        return [
          {
            id,
            createdAt: previous?.createdAt ?? new Date().toISOString(),
            rhythm,
          },
          ...rows.filter((row) => row.id !== id),
        ];
      }),
    remove: async (id: string) => {
      let item: WrittenStudy | undefined;
      await update((rows) => {
        item = rows.find((row) => row.id === id);
        return rows.filter((row) => row.id !== id);
      });
      if (item) setRemoved(item);
    },
    undo: async () => {
      if (!removed) return;
      await update((rows) => [
        removed,
        ...rows.filter((row) => row.id !== removed.id),
      ]);
      setRemoved(null);
    },
  };
}
