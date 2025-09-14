import { atom } from "jotai";
import { atomFamily } from "jotai/utils";
import type { Param, NoteData, SerializedData } from "./types";

export const noteAtomFamily = atomFamily(
  (param: Param) =>
    atom({
      noteText: param.noteText || "",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    }),
  (a: Param, b: Param) => a.id === b.id
);

export const notesAtom = atom<string[]>([]);

export const serializeAtom = atom<
  null,
  | { type: "serialize"; callback: (value: string) => void }
  | { type: "deserialize"; value: string }
>(null, (get, set, action) => {
  if (action.type === "serialize") {
    const notes = get(notesAtom);
    const noteMap: Record<string, NoteData> = {};
    notes.forEach((id) => {
      noteMap[id] = get(noteAtomFamily({ id }));
    });
    const obj: SerializedData = {
      notes,
      noteMap,
    };
    action.callback(JSON.stringify(obj));
  } else if (action.type === "deserialize") {
    const obj: SerializedData = JSON.parse(action.value);
    obj.notes.forEach((id: string) => {
      const note = obj.noteMap[id];
      set(noteAtomFamily({ id, ...note }), note);
    });
    set(notesAtom, obj.notes);
  }
});
