import { atom } from "jotai";
import { atomFamily } from "jotai/utils";
import { nanoid } from "nanoid";
import { createSession } from "./sessionUtils";
import type {
  LegacySerializedData,
  NoteData,
  Param,
  SerializedData,
  SessionData,
} from "./types";

export const noteAtomFamily = atomFamily(
  (param: Param) =>
    atom({
      noteText: param.noteText || "",
      timestamp:
        param.timestamp ||
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
    }),
  (a: Param, b: Param) => a.id === b.id
);

export const sessionsAtom = atom<SessionData[]>([]);
export const activeSessionIdAtom = atom<string | null>(null);

const isLegacyData = (
  obj: SerializedData | LegacySerializedData,
): obj is LegacySerializedData => "notes" in obj;

export const serializeAtom = atom<
  null,
  | { type: "serialize"; callback: (value: string) => void }
  | { type: "deserialize"; value: string }
>(null, (get, set, action) => {
  if (action.type === "serialize") {
    const sessions = get(sessionsAtom);
    const activeSessionId = get(activeSessionIdAtom);
    const noteMap: Record<string, NoteData> = {};
    sessions.forEach((session) => {
      session.noteIds.forEach((id) => {
        noteMap[id] = get(noteAtomFamily({ id }));
      });
    });
    const obj: SerializedData = {
      version: 2,
      sessions,
      noteMap,
      activeSessionId,
    };
    action.callback(JSON.stringify(obj));
  } else if (action.type === "deserialize") {
    const obj = JSON.parse(action.value) as SerializedData | LegacySerializedData;
    const sessions = isLegacyData(obj)
      ? [
          {
            ...createSession(nanoid()),
            noteIds: obj.notes,
          },
        ]
      : obj.sessions;

    Object.entries(obj.noteMap).forEach(([id, note]) => {
      set(noteAtomFamily({ id, ...note }), note);
    });

    set(sessionsAtom, sessions);
    set(
      activeSessionIdAtom,
      isLegacyData(obj) ? sessions[0]?.id ?? null : obj.activeSessionId ?? null,
    );
  }
});
