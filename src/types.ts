export type Param = { id: string; noteText?: string; timestamp?: string };

export type NoteData = {
  noteText: string;
  timestamp: string;
};

export type SessionData = {
  id: string;
  title: string;
  createdAt: string;
  noteIds: string[];
};

export type SerializedData = {
  version: 2;
  sessions: SessionData[];
  noteMap: Record<string, NoteData>;
  activeSessionId: string | null;
};

export type LegacySerializedData = {
  notes: string[];
  noteMap: Record<string, NoteData>;
};
