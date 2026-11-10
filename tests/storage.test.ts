import test from "node:test";
import assert from "node:assert/strict";
import { JournalFiles, journalFiles } from "../src/storage/journalFiles";

function fixture(
  initial: Record<string, string>,
  fail?: (op: string, path: string) => boolean,
) {
  const data = new Map(Object.entries(initial));
  const check = (op: string, path: string) => {
    if (fail?.(op, path)) throw new Error("Falha de disco simulada.");
  };
  const files: JournalFiles = {
    read: async (path) => data.get(path) ?? null,
    write: async (path, content) => {
      check("write", path);
      data.set(path, content);
    },
    move: async (from, to) => {
      check("move", from);
      assert.ok(data.has(from));
      data.set(to, data.get(from)!);
      data.delete(from);
    },
    remove: async (path) => {
      check("remove", path);
      data.delete(path);
    },
  };
  return { data, store: journalFiles(files, "journal") };
}

test("gravação transacional substitui o caderno somente após criar o novo arquivo", async () => {
  const { data, store } = fixture({ journal: "anterior" });
  await store.write("novo");
  assert.equal(await store.read(), "novo");
  assert.deepEqual([...data.keys()], ["journal"]);
});

test("falha ao escrever o temporário preserva integralmente o caderno anterior", async () => {
  const { data, store } = fixture(
    { journal: "anterior" },
    (op) => op === "write",
  );
  await assert.rejects(store.write("novo"));
  assert.equal(data.get("journal"), "anterior");
  assert.equal(await store.read(), "anterior");
});

test("falha ao promover a nova versão restaura o arquivo anterior", async () => {
  const { data, store } = fixture(
    { journal: "anterior" },
    (op, path) => op === "move" && path.endsWith(".next"),
  );
  await assert.rejects(store.write("novo"));
  assert.equal(data.get("journal"), "anterior");
  assert.equal(await store.read(), "anterior");
});

test("interrupção ou falha na restauração permite recuperar a cópia anterior", async () => {
  const { data, store } = fixture(
    { journal: "anterior" },
    (op, path) => op === "move" && path !== "journal",
  );
  await assert.rejects(store.write("novo"));
  assert.equal(data.has("journal"), false);
  assert.equal(await store.read(), "anterior");
  const interrupted = fixture({
    "journal.previous": "preservado",
    "journal.next": "incompleto",
  });
  assert.equal(await interrupted.store.read(), "preservado");
  await interrupted.store.write("concluído");
  assert.equal(await interrupted.store.read(), "concluído");
});

test("erro de limpeza depois da promoção não informa uma falha fictícia de gravação", async () => {
  const { store } = fixture({}, (op) => op === "remove");
  await store.write("salvo");
  assert.equal(await store.read(), "salvo");
});
