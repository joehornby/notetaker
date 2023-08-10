import type { NoteData, SessionData } from "./types";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
});

const sessionDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export const formatDefaultSessionTitle = (date: Date) =>
  `Notes on ${dateFormatter.format(date)}`;

export const createSession = (id: string, date = new Date()): SessionData => ({
  id,
  title: formatDefaultSessionTitle(date),
  createdAt: date.toISOString(),
  noteIds: [],
});

export const formatSessionDate = (createdAt: string) =>
  sessionDateFormatter.format(new Date(createdAt));

export const formatSessionTimeRange = (
  noteIds: string[],
  noteMap: Record<string, NoteData>,
) => {
  const times = noteIds
    .map((id) => noteMap[id]?.timestamp)
    .filter((timestamp): timestamp is string => Boolean(timestamp));

  if (times.length === 0) {
    return "No notes yet";
  }

  const first = times[0];
  const last = times[times.length - 1];

  return first === last ? first : `${first} - ${last}`;
};
