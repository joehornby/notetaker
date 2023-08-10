import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
import { useAtom } from "jotai";
import { serializeAtom, sessionsAtom } from "../atoms";
import {
  formatSessionDate,
  formatSessionTimeRange,
} from "../sessionUtils";
import type { NoteData, SessionData } from "../types";

interface SessionOverviewProps {
  onOpenSession: (id: string) => void;
  onNewSession: () => void;
}

interface SessionCardProps {
  session: SessionData;
  noteMap: Record<string, NoteData>;
  onOpenSession: (id: string) => void;
}

const SessionCard = ({
  session,
  noteMap,
  onOpenSession,
}: SessionCardProps) => {
  const [, setSessions] = useAtom(sessionsAtom);
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(session.title);
  const noteCount = session.noteIds.length;
  const timeRange = useMemo(
    () => formatSessionTimeRange(session.noteIds, noteMap),
    [noteMap, session.noteIds],
  );

  useEffect(() => {
    setDraftTitle(session.title);
  }, [session.title]);

  const saveTitle = () => {
    const nextTitle = draftTitle.trim() || session.title;

    setSessions((prev) =>
      prev.map((item) =>
        item.id === session.id ? { ...item, title: nextTitle } : item,
      ),
    );
    setIsEditing(false);
  };

  return (
    <article
      className="group relative flex min-h-[10rem] cursor-pointer flex-col rounded-lg bg-white p-4 shadow-sm ring-1 ring-zinc-950/5 transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-zinc-950/10 focus-within:shadow-md dark:bg-zinc-900 dark:ring-white/10 dark:hover:shadow-black/30"
      onClick={() => {
        if (!isEditing) {
          onOpenSession(session.id);
        }
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (!isEditing && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onOpenSession(session.id);
        }
      }}
    >
      <span className="absolute right-3 top-3 rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium tabular-nums text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
        {noteCount} {noteCount === 1 ? "note" : "notes"}
      </span>
      <div className="pr-20">
        {isEditing ? (
          <input
            className="w-full rounded-md bg-zinc-50 px-2 py-1 text-xl font-medium tracking-tight text-zinc-900 outline-none ring-2 ring-zinc-400/30 dark:bg-zinc-800 dark:text-zinc-100"
            value={draftTitle}
            autoFocus
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => setDraftTitle(event.target.value)}
            onBlur={saveTitle}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                saveTitle();
              }

              if (event.key === "Escape") {
                setDraftTitle(session.title);
                setIsEditing(false);
              }
            }}
          />
        ) : (
          <div className="flex items-center gap-2">
            <h2 className="min-w-0 truncate text-xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
              {session.title}
            </h2>
            <button
              type="button"
              aria-label="Edit session title"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-zinc-400 opacity-0 transition hover:bg-zinc-950/5 hover:text-zinc-700 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/40 group-hover:opacity-100 dark:text-zinc-500 dark:hover:bg-white/10 dark:hover:text-zinc-200"
              onClick={(event) => {
                event.stopPropagation();
                setIsEditing(true);
              }}
            >
              <EditOutlined aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
      <div className="mt-auto flex items-end justify-between gap-4 border-t border-zinc-950/5 pt-4 text-sm text-zinc-500 dark:border-white/10 dark:text-zinc-400">
        <span>{formatSessionDate(session.createdAt)}</span>
        <span className="tabular-nums">{timeRange}</span>
      </div>
    </article>
  );
};

export const SessionOverview = ({
  onOpenSession,
  onNewSession,
}: SessionOverviewProps) => {
  const [sessions] = useAtom(sessionsAtom);
  const [, dispatch] = useAtom(serializeAtom);
  const [noteMap, setNoteMap] = useState<Record<string, NoteData>>({});

  useEffect(() => {
    dispatch({
      type: "serialize",
      callback: (value) => {
        setNoteMap(JSON.parse(value).noteMap);
      },
    });
  }, [dispatch, sessions]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-6 flex shrink-0 items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 h-7" aria-hidden="true" />
          <h1 className="m-0 whitespace-nowrap text-balance p-0 text-4xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
            NoteTaker
          </h1>
        </div>
        <button
          type="button"
          className="mb-1 inline-flex shrink-0 items-center gap-2 rounded-full bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm shadow-zinc-950/10 transition hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/40 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
          onClick={onNewSession}
        >
          <PlusOutlined aria-hidden="true" />
          New session
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pb-2 pr-1">
        <div className="grid gap-3 sm:grid-cols-2">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              noteMap={noteMap}
              onOpenSession={onOpenSession}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
