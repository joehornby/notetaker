import {
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { a, useTransition } from "@react-spring/web";
import { useEffect, useRef, useState } from "react";
import { Form, Input } from "antd";
import type { InputRef } from "antd";
import { useAtom } from "jotai";
import { nanoid } from "nanoid";
import { noteAtomFamily, notesAtom, serializeAtom } from "../atoms";
import type { SerializedData } from "../types";
import { Notes } from "./Notes";

/* --------------------------------------------------------------------------
 * ACTION BAR STORYBOARD
 *
 * Read top-to-bottom. Each stage starts when selection count changes.
 *
 *   0ms   toolbar rests at the bottom with export actions visible
 *   0ms   first note selection updates copy/download labels to selected scope
 *  80ms   delete action fades in, scale 0.92 -> 1, y 6px -> 0
 *   0ms   clearing selection fades delete out and returns export actions to all
 * -------------------------------------------------------------------------- */

const ACTION_BAR = {
  deleteFrom: {
    opacity: 0, // hidden before any notes are selected
    transform: "translate3d(0, 6px, 0) scale(0.92)", // rises into the toolbar
  },
  deleteEnter: {
    opacity: 1, // visible when selection exists
    transform: "translate3d(0, 0, 0) scale(1)", // settled toolbar position
  },
  deleteLeave: {
    opacity: 0, // fades before unmounting
    transform: "translate3d(0, 4px, 0) scale(0.96)", // exits quietly downward
  },
  deleteSpring: { tension: 420, friction: 28 }, // snappy but not bouncy
};

const escapeCsvValue = (value: string) => {
  if (!/[",\n\r]/.test(value)) {
    return value;
  }

  return `"${value.replace(/"/g, '""')}"`;
};

const escapeTsvValue = (value: string) =>
  value.replace(/\t/g, " ").replace(/\r?\n/g, " ");

const escapeHtmlValue = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const buildMiroText = ({ notes, noteMap }: SerializedData) =>
  [
    ["Timestamp", "Note"].join("\t"),
    ...notes.map((id) => {
      const note = noteMap[id];

      return [
        escapeTsvValue(note?.timestamp ?? ""),
        escapeTsvValue(note?.noteText ?? ""),
      ].join("\t");
    }),
  ].join("\n");

const buildMiroHtml = ({ notes, noteMap }: SerializedData) => `
<table>
  <thead>
    <tr>
      <th style="background-color: #bfbfbf; color: #000000; font-weight: 700;">Timestamp</th>
      <th style="background-color: #bfbfbf; color: #000000; font-weight: 700;">Note</th>
    </tr>
  </thead>
  <tbody>
    ${notes
      .map((id) => {
        const note = noteMap[id];
        const timestamp = escapeHtmlValue(
          escapeTsvValue(note?.timestamp ?? ""),
        );
        const noteText = escapeHtmlValue(escapeTsvValue(note?.noteText ?? ""));

        return `<tr><td style="background-color: #d9d9d9; color: #000000; font-weight: 700;">${timestamp}</td><td style="background-color: #ffffff; color: #000000;">${noteText}</td></tr>`;
      })
      .join("")}
  </tbody>
</table>`;

const buildNotesCsv = ({ notes, noteMap }: SerializedData) => {
  const rows = notes.map((id) => {
    const note = noteMap[id];

    return [
      escapeCsvValue(note?.timestamp ?? ""),
      escapeCsvValue(note?.noteText ?? ""),
    ].join(",");
  });

  return ["Timestamp,Note", ...rows].join("\n");
};

const filterSerializedData = (
  data: SerializedData,
  selectedIds: Set<string>,
): SerializedData => {
  if (selectedIds.size === 0) {
    return data;
  }

  return {
    notes: data.notes.filter((id) => selectedIds.has(id)),
    noteMap: data.noteMap,
  };
};

export const NoteList = () => {
  const [form] = Form.useForm();
  const inputRef = useRef<InputRef>(null);
  const [notes, setNotes] = useAtom(notesAtom);
  const [copyLabel, setCopyLabel] = useState("Copy for Miro");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const selectedCount = selectedIds.size;
  const hasNotes = notes.length > 0;
  const actionScopeLabel = selectedCount > 0 ? "selected" : "all";

  const deleteTransitions = useTransition(
    selectedCount > 0 ? [selectedCount] : [],
    {
      from: ACTION_BAR.deleteFrom,
      enter: ACTION_BAR.deleteEnter,
      leave: ACTION_BAR.deleteLeave,
      config: ACTION_BAR.deleteSpring,
    },
  );

  const [, dispatch] = useAtom(serializeAtom);

  const save = () => {
    dispatch({
      type: "serialize",
      callback: (value) => {
        localStorage.setItem("notetaker-notes", value);
      },
    });
  };

  const getSerializedData = () => {
    let data: SerializedData = { notes: [], noteMap: {} };

    dispatch({
      type: "serialize",
      callback: (value) => {
        data = JSON.parse(value);
      },
    });

    return data;
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const removeSelected = () => {
    const idsToRemove = new Set(selectedIds);

    setNotes((prev) => prev.filter((id) => !idsToRemove.has(id)));
    idsToRemove.forEach((id) => noteAtomFamily.remove({ id }));
    setSelectedIds(new Set());
  };

  const copyForMiro = async () => {
    const data = filterSerializedData(getSerializedData(), selectedIds);
    const text = buildMiroText(data);

    if ("ClipboardItem" in window && navigator.clipboard.write) {
      const html = buildMiroHtml(data);

      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([text], { type: "text/plain" }),
        }),
      ]);
    } else {
      await navigator.clipboard.writeText(text);
    }

    setCopyLabel("Copied");

    window.setTimeout(() => {
      setCopyLabel("Copy for Miro");
    }, 1400);
  };

  const downloadCsv = () => {
    const csv = buildNotesCsv(
      filterSerializedData(getSerializedData(), selectedIds),
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `notetaker-notes-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const load = () => {
    const value = localStorage.getItem("notetaker-notes");
    console.log(value);
    if (value) {
      dispatch({ type: "deserialize", value });
    }
  };

  useEffect(() => {
    console.log("loading...");
    load();
  }, []);

  useEffect(() => {
    setSelectedIds((prev) => {
      const noteIds = new Set(notes);
      const next = new Set([...prev].filter((id) => noteIds.has(id)));

      return next.size === prev.size ? prev : next;
    });
  }, [notes]);

  const add = () => {
    console.log("adding");
    const noteText = form.getFieldValue("inputNote");
    const id = nanoid();
    noteAtomFamily({ id, noteText });
    setNotes((prev) => [...prev, id]);
    inputRef.current?.focus();
    form.setFieldValue("inputNote", "");
    save();
  };

  const [actualTime, setActualTime] = useState(
    new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
  );

  useEffect(() => {
    const updateClock = () => {
      setActualTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    };

    updateClock();

    const interval = setInterval(() => {
      updateClock();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <Form
        className="shrink-0"
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.shiftKey === false) {
            e.preventDefault();
            form.submit();
          }
        }}
        form={form}
        onFinish={add}
      >
        <Form.Item
          name="inputNote"
          label={actualTime}
          rules={[{ required: true }]}
        >
          <Input.TextArea
            ref={inputRef}
            rows={4}
            className="mt-2 h-[120px] w-full resize-none rounded-lg border-none bg-white p-4 text-base text-zinc-900 shadow-sm ring-1 ring-zinc-950/5 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400/30 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-white/10 dark:placeholder:text-zinc-500"
            bordered={false}
            placeholder="Type notes..."
          />
        </Form.Item>
      </Form>
      <div className="min-h-0 flex-1 overflow-y-auto pb-24 pr-1">
        <Notes selectedIds={selectedIds} onToggleSelection={toggleSelection} />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-3">
        <div className="pointer-events-auto flex max-w-full items-center gap-1 rounded-full bg-white/90 p-1.5 shadow-lg shadow-zinc-950/10 ring-1 ring-zinc-950/10 backdrop-blur dark:bg-zinc-900/90 dark:shadow-black/30 dark:ring-white/10">
          {selectedCount > 0 ? (
            <button
              type="button"
              className="rounded-full px-2.5 py-1.5 text-sm font-medium tabular-nums text-zinc-500 hover:bg-zinc-950/5 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100"
              onClick={clearSelection}
            >
              {selectedCount} selected
            </button>
          ) : null}
          <button
            type="button"
            disabled={!hasNotes}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-950/5 disabled:cursor-default disabled:text-zinc-300 disabled:hover:bg-transparent dark:text-zinc-300 dark:hover:bg-white/10 dark:disabled:text-zinc-700 dark:disabled:hover:bg-transparent"
            onClick={copyForMiro}
          >
            <CopyOutlined aria-hidden="true" />
            {copyLabel === "Copied" ? "Copied" : `Miro ${actionScopeLabel}`}
          </button>
          <button
            type="button"
            disabled={!hasNotes}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-950/5 disabled:cursor-default disabled:text-zinc-300 disabled:hover:bg-transparent dark:text-zinc-300 dark:hover:bg-white/10 dark:disabled:text-zinc-700 dark:disabled:hover:bg-transparent"
            onClick={downloadCsv}
          >
            <DownloadOutlined aria-hidden="true" />
            CSV {actionScopeLabel}
          </button>
          {deleteTransitions((style) => (
            <a.button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1.5 text-sm font-medium tabular-nums text-red-700 ring-1 ring-red-700/10 hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-300/10 dark:hover:bg-red-900/50"
              style={style}
              onClick={removeSelected}
            >
              <DeleteOutlined aria-hidden="true" />
              Delete
            </a.button>
          ))}
        </div>
      </div>
    </div>
  );
};
