import React, { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import data from "../data/rhythms.json";
import { Rhythm, THEME as T } from "../pandeiro-ui-base/types";
import { Button, Label, fonts } from "./ui";
export const RHYTHMS = data as Rhythm[];
export function RhythmLibrary({
  open,
  selected,
  onSelect,
  onClose,
}: {
  open: boolean;
  selected: string;
  onSelect: (rhythm: Rhythm) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState(""),
    [group, setGroup] = useState("todos"),
    [padbt, setPadbt] = useState(false);
  const groups = useMemo(
    () =>
      Array.from(new Map(RHYTHMS.map((r) => [r.groupId, r.group])).entries()),
    [],
  );
  const normalized = query
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const filtered = RHYTHMS.filter(
    (r) =>
      (!padbt || r.padbt) &&
      (group === "todos" || r.groupId === group) &&
      `${r.name} ${r.description}`
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .includes(normalized),
  );
  return (
    <Modal
      visible={open}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: T.black }}>
        <View style={styles.wrap}>
          <View style={styles.heading}>
            <View style={{ flex: 1, gap: 8 }}>
              <Label orange>BIBLIOTECA / 148 RITMOS</Label>
              <Text style={styles.title}>Encontre seu ritmo.</Text>
            </View>
            <Button onPress={onClose} label="Fechar biblioteca">
              ✕
            </Button>
          </View>
          <TextInput
            accessibilityLabel="Buscar ritmo"
            placeholder="Buscar samba, baião, xote…"
            placeholderTextColor={T.muted}
            value={query}
            onChangeText={setQuery}
            style={styles.search}
            autoCapitalize="none"
          />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button active={!padbt} onPress={() => setPadbt(false)}>
              Completa · 148
            </Button>
            <Button active={padbt} onPress={() => setPadbt(true)}>
              PADBT · 75
            </Button>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ maxHeight: 50 }}
            contentContainerStyle={{ gap: 8 }}
          >
            <Button
              active={group === "todos"}
              onPress={() => setGroup("todos")}
            >
              Todos
            </Button>
            {groups.map(([id, name]) => (
              <Button
                key={id}
                active={group === id}
                onPress={() => setGroup(id)}
              >
                {name}
              </Button>
            ))}
          </ScrollView>
          <Label>{filtered.length} RESULTADOS · CICLOS DE 6 A 32 PASSOS</Label>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 20 }}
            keyboardShouldPersistTaps="handled"
          >
            {!filtered.length && (
              <Text style={styles.description}>
                Nenhum ritmo encontrado. Tente outro nome ou grupo.
              </Text>
            )}
            {filtered.map((r) => (
              <Pressable
                key={r.id}
                accessibilityRole="button"
                accessibilityLabel={`Escolher ${r.name}`}
                onPress={() => {
                  onSelect(r);
                  onClose();
                }}
                style={({ pressed }) => [
                  styles.row,
                  {
                    backgroundColor:
                      selected === r.id
                        ? "#21150D"
                        : pressed
                          ? T.panel
                          : T.black,
                  },
                ]}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <Text style={styles.name}>{r.name}</Text>
                  <Label orange>{r.sequence.length} PASSOS</Label>
                </View>
                <Text style={styles.sequence}>{r.sequence}</Text>
                <Text style={styles.description}>{r.description}</Text>
                <Text style={styles.source}>
                  {r.group} · {r.subdivision} passos/tempo · {r.sources.length}{" "}
                  {r.sources.length === 1 ? "fonte" : "fontes"}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    width: "100%",
    maxWidth: 850,
    alignSelf: "center",
    padding: 22,
    gap: 16,
  },
  heading: { flexDirection: "row", alignItems: "center", gap: 12 },
  title: {
    fontFamily: fonts.title,
    fontSize: 32,
    color: T.ivory,
    letterSpacing: -0.8,
  },
  search: {
    borderWidth: 1,
    borderColor: T.line,
    borderRadius: 5,
    padding: 16,
    fontSize: 16,
    fontFamily: fonts.text,
    color: T.ivory,
  },
  row: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: T.line,
    gap: 9,
    borderRadius: 4,
  },
  name: { color: T.ivory, fontFamily: fonts.text, fontSize: 18, flex: 1 },
  sequence: {
    color: T.orange,
    fontFamily: fonts.mono,
    fontSize: 13,
    letterSpacing: 2,
  },
  description: {
    color: T.silver,
    fontFamily: fonts.text,
    fontSize: 14,
    lineHeight: 20,
  },
  source: {
    color: T.muted,
    fontFamily: fonts.mono,
    fontSize: 10,
    lineHeight: 16,
  },
});
