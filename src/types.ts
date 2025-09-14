export type Param = { id: string; noteText?: string };

export type NoteData = {
  noteText: string;
  timestamp: string;
};

export type SerializedData = {
  notes: string[];
  noteMap: Record<string, NoteData>;
};
