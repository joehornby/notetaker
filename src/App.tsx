import { PlusOutlined } from "@ant-design/icons";
import { Provider, useAtom } from "jotai";
import { nanoid } from "nanoid";
import { useEffect, useState } from "react";
import { activeSessionIdAtom, serializeAtom, sessionsAtom } from "./atoms";
import { NoteList } from "./components";
import { createSession } from "./sessionUtils";

import "./App.css";

const STORAGE_KEY = "notetaker-notes";

const AppContent = () => {
  const [sessions, setSessions] = useAtom(sessionsAtom);
  const [activeSessionId, setActiveSessionId] = useAtom(activeSessionIdAtom);
  const [, dispatch] = useAtom(serializeAtom);
  const [hasLoaded, setHasLoaded] = useState(false);
  const activeSession =
    sessions.find((session) => session.id === activeSessionId) ?? null;

  useEffect(() => {
    const value = localStorage.getItem(STORAGE_KEY);

    if (value) {
      dispatch({ type: "deserialize", value });
    }

    setHasLoaded(true);
  }, [dispatch]);

  useEffect(() => {
    if (!hasLoaded) {
      return;
    }

    dispatch({
      type: "serialize",
      callback: (value) => {
        localStorage.setItem(STORAGE_KEY, value);
      },
    });
  }, [activeSessionId, dispatch, hasLoaded, sessions]);

  useEffect(() => {
    if (!hasLoaded || activeSession) {
      return;
    }

    if (sessions.length > 0) {
      setActiveSessionId(sessions[0].id);
      return;
    }

    const session = createSession(nanoid());

    setSessions([session]);
    setActiveSessionId(session.id);
  }, [activeSession, hasLoaded, sessions, setActiveSessionId, setSessions]);

  const startNewSession = () => {
    const session = createSession(nanoid());

    setSessions((prev) => [session, ...prev]);
    setActiveSessionId(session.id);
  };

  if (!activeSession) {
    return null;
  }

  return (
    <>
      <div className="mb-6 flex shrink-0 flex-col items-start gap-3">
        <div className="min-w-0">
          <h1 className="m-0 truncate p-0 text-4xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
            NoteTaker
          </h1>
          <p className="mt-1 truncate text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {activeSession.title}
          </p>
        </div>
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-medium text-zinc-600 shadow-sm shadow-zinc-950/5 ring-1 ring-zinc-950/10 transition hover:bg-zinc-50 hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/40 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-white/10 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          onClick={startNewSession}
        >
          <PlusOutlined aria-hidden="true" />
          New session
        </button>
      </div>
      <NoteList session={activeSession} />
    </>
  );
};

export default function App() {
  return (
    <Provider>
      <AppContent />
    </Provider>
  );
}
