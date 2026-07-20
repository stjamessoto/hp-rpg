import { useEffect, useRef, useSyncExternalStore } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { NarratorAdapter } from "@core/adapters/NarratorAdapter.js";
import { createSeededRngAdapter } from "@core/adapters/RngAdapter.js";
import { canonData } from "@core/data/loader.js";
import { createCharacterFlow } from "@core/character/createCharacter.js";
import { listCharacterIds, loadCharacter, saveCharacter } from "@core/character/save.js";
import type { Character } from "@core/character/types.js";
import { loadGameProgress } from "@core/game/gameSave.js";
import { runGameLoop } from "@core/game/sceneEngine.js";
import { sceneBundle, INTRO_START_SCENE_ID } from "@core/game/scenesLoader.js";

import { AsyncStorageAdapter } from "./src/adapters/AsyncStorageAdapter.js";
import { GeminiNarratorAdapter } from "./src/adapters/GeminiNarratorAdapter.js";
import { NativeUiAdapter } from "./src/adapters/NativeUiAdapter.js";

// One adapter instance per app run — created outside the component so it
// survives re-renders (React state can't hold something the game engine
// mutates imperatively from inside async /core calls).
const ui = new NativeUiAdapter();
const storage = new AsyncStorageAdapter();

// Optional: only wired up if EXPO_PUBLIC_GEMINI_API_KEY is set (see
// mobile/.env.example). Expo's Metro config inlines EXPO_PUBLIC_*
// variables from .env at build/start time, same idea as Vite's
// VITE_*/import.meta.env on the web side. Undefined falls back to
// /core's own NullNarratorAdapter default.
const geminiApiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const narrator: NarratorAdapter | undefined = geminiApiKey
  ? new GeminiNarratorAdapter(geminiApiKey, process.env.EXPO_PUBLIC_GEMINI_MODEL)
  : undefined;

function AskForm({ placeholder, onSubmit }: { placeholder?: string; onSubmit: (value: string) => void }) {
  const valueRef = useRef("");
  const inputRef = useRef<TextInput>(null);

  return (
    <View style={styles.askRow}>
      <TextInput
        ref={inputRef}
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#a99a80"
        autoFocus
        onChangeText={(text) => {
          valueRef.current = text;
        }}
        onSubmitEditing={() => onSubmit(valueRef.current)}
      />
      <Pressable style={styles.submitButton} onPress={() => onSubmit(valueRef.current)}>
        <Text style={styles.submitButtonText}>Go</Text>
      </Pressable>
    </View>
  );
}

async function runFromScene(character: Character, startSceneId: string): Promise<void> {
  await runGameLoop(ui, character, sceneBundle, startSceneId, canonData, { narrator, storage });
  await ui.print("Your progress has been saved to this device.");
}

async function startNewCharacter(): Promise<void> {
  const seed = Math.floor(Math.random() * 2 ** 31);
  const rng = createSeededRngAdapter(seed);

  await ui.print("Somewhere, a quill dips itself in ink. Your story is about to be written — let's begin.");
  const character = await createCharacterFlow(ui, rng, canonData);
  await saveCharacter(storage, character);
  await ui.print(`(seed ${seed} — reproducible via createSeededRngAdapter(${seed}))`);

  await runFromScene(character, INTRO_START_SCENE_ID);
}

/** Returns true if an existing save was picked up and played (so the caller shouldn't also start a new one). */
async function offerContinueOrNew(existingIds: string[]): Promise<boolean> {
  const NEW_CHARACTER_ID = "__new-character__";
  const options: { id: string; label: string }[] = [];
  const loaded = new Map<string, Character>();

  for (const id of existingIds) {
    const character = await loadCharacter(storage, id);
    if (!character) continue;
    loaded.set(id, character);

    const progress = await loadGameProgress(storage, id);
    const houseName = character.house[0].toUpperCase() + character.house.slice(1);
    if (progress) {
      const hogwartsYear = sceneBundle[progress.currentSceneId]?.hogwartsYear;
      const yearLabel = hogwartsYear ? `Year ${hogwartsYear}` : "in progress";
      options.push({ id, label: `Continue as ${character.identity.name} (${houseName}, ${yearLabel})` });
    } else {
      options.push({ id, label: `${character.identity.name} (${houseName}) — story complete` });
    }
  }
  options.push({ id: NEW_CHARACTER_ID, label: "Start a new character" });

  const choiceId = await ui.choose("Welcome back. What would you like to do?", options);
  if (choiceId === NEW_CHARACTER_ID) return false;

  const character = loaded.get(choiceId)!;
  const progress = await loadGameProgress(storage, choiceId);

  if (!progress) {
    await ui.print(`${character.identity.name}'s story has already reached its end.`);
    return true;
  }

  await ui.print(`Picking up where you left off, ${character.identity.name}...`);
  await runFromScene(character, progress.currentSceneId);
  return true;
}

export default function App() {
  const state = useSyncExternalStore(ui.subscribe, ui.getState, ui.getState);
  const scrollRef = useRef<ScrollView>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // guard against StrictMode's double-invoke in dev
    started.current = true;

    void (async () => {
      const existingIds = await listCharacterIds(storage);
      const resumed = existingIds.length > 0 && (await offerContinueOrNew(existingIds));
      if (!resumed) {
        await startNewCharacter();
      }
    })();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={12}
      >
        <View style={styles.header}>
          <Text style={styles.title}>HP-RPG</Text>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.log}
          contentContainerStyle={styles.logContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {state.log.map((entry) => (
            <Text key={entry.id} style={entry.isPlayer ? styles.playerLine : styles.narrationLine}>
              {entry.text}
            </Text>
          ))}
        </ScrollView>

        <View style={styles.controls}>
          {state.pending?.kind === "ask" && (
            <AskForm placeholder={state.pending.placeholder} onSubmit={state.pending.resolve} />
          )}
          {state.pending?.kind === "choose" &&
            state.pending.options.map((option) => (
              <Pressable
                key={option.id}
                style={styles.choiceButton}
                onPress={() => state.pending?.kind === "choose" && state.pending.resolve(option.id)}
              >
                <Text style={styles.choiceButtonText}>{option.label}</Text>
              </Pressable>
            ))}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#14100c" },
  flex: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  title: { color: "#c9a24b", fontSize: 22, fontWeight: "700", letterSpacing: 1 },
  log: { flex: 1, marginHorizontal: 12, marginBottom: 8, backgroundColor: "#1f1811", borderRadius: 8 },
  logContent: { padding: 14 },
  narrationLine: { color: "#ece3d2", fontSize: 15, lineHeight: 22, marginBottom: 10 },
  playerLine: { color: "#c9a24b", fontStyle: "italic", fontSize: 15, lineHeight: 22, marginBottom: 10 },
  controls: { paddingHorizontal: 12, paddingBottom: 12, gap: 8 },
  askRow: { flexDirection: "row", gap: 8 },
  input: {
    flex: 1,
    backgroundColor: "#1f1811",
    color: "#ece3d2",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#3a2f22",
  },
  submitButton: {
    backgroundColor: "#1f1811",
    borderRadius: 6,
    paddingHorizontal: 16,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#c9a24b",
  },
  submitButtonText: { color: "#c9a24b", fontWeight: "600" },
  choiceButton: {
    backgroundColor: "#1f1811",
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#3a2f22",
  },
  choiceButtonText: { color: "#ece3d2", fontSize: 15 },
});
