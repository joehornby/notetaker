import {
  CheckOutlined,
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Form, Input } from "antd";
import type { InputRef } from "antd";
import { useAtom } from "jotai";
import { nanoid } from "nanoid";
import { noteAtomFamily, serializeAtom, sessionsAtom } from "../atoms";
import type { NoteData, SessionData } from "../types";
import { Notes } from "./Notes";

type ExportData = {
  notes: string[];
  noteMap: Record<string, NoteData>;
};

interface NoteListProps {
  session: SessionData;
}

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

const buildMiroText = ({ notes, noteMap }: ExportData) =>
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

const buildMiroHtml = ({ notes, noteMap }: ExportData) => `
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

const buildNotesCsv = ({ notes, noteMap }: ExportData) => {
  const rows = notes.map((id) => {
    const note = noteMap[id];

    return [
      escapeCsvValue(note?.timestamp ?? ""),
      escapeCsvValue(note?.noteText ?? ""),
    ].join(",");
  });

  return ["Timestamp,Note", ...rows].join("\n");
};

const filterExportData = (
  data: ExportData,
  selectedIds: Set<string>,
): ExportData => {
  if (selectedIds.size === 0) {
    return data;
  }

  return {
    notes: data.notes.filter((id) => selectedIds.has(id)),
    noteMap: data.noteMap,
  };
};

export const NoteList = ({ session }: NoteListProps) => {
  const [form] = Form.useForm();
  const inputRef = useRef<InputRef>(null);
  const noteEndRef = useRef<HTMLDivElement>(null);
  const [, setSessions] = useAtom(sessionsAtom);
  const [copyLabel, setCopyLabel] = useState("Copy for Miro");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [, dispatch] = useAtom(serializeAtom);

  const notes = session.noteIds;
  const selectedCount = selectedIds.size;
  const hasNotes = notes.length > 0;
  const hasSelection = selectedCount > 0;
  const actionScopeLabel = hasSelection ? "selected" : "all";
  const isCopied = copyLabel === "Copied";

  const getSessionExportData = () => {
    let data: ExportData = { notes, noteMap: {} };

    dispatch({
      type: "serialize",
      callback: (value) => {
        const serialized = JSON.parse(value) as {
          noteMap: Record<string, NoteData>;
        };

        data = {
          notes,
          noteMap: serialized.noteMap,
        };
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

    setSessions((prev) =>
      prev.map((item) =>
        item.id === session.id
          ? {
              ...item,
              noteIds: item.noteIds.filter((id) => !idsToRemove.has(id)),
            }
          : item,
      ),
    );
    idsToRemove.forEach((id) => noteAtomFamily.remove({ id }));
    setSelectedIds(new Set());
  };

  const copyForMiro = async () => {
    const data = filterExportData(getSessionExportData(), selectedIds);
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
      filterExportData(getSessionExportData(), selectedIds),
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `notetaker-notes-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    setSelectedIds((prev) => {
      const noteIds = new Set(notes);
      const next = new Set([...prev].filter((id) => noteIds.has(id)));

      return next.size === prev.size ? prev : next;
    });
  }, [notes]);

  useLayoutEffect(() => {
    noteEndRef.current?.scrollIntoView({ block: "end" });

    const scrollToLatestNote = window.requestAnimationFrame(() => {
      noteEndRef.current?.scrollIntoView({ block: "end" });
    });

    return () => window.cancelAnimationFrame(scrollToLatestNote);
  }, [notes]);

  const add = () => {
    const noteText = form.getFieldValue("inputNote")?.trim();

    if (!noteText) {
      inputRef.current?.focus();
      return;
    }

    const id = nanoid();
    noteAtomFamily({ id, noteText });
    setSessions((prev) =>
      prev.map((item) =>
        item.id === session.id
          ? { ...item, noteIds: [...item.noteIds, id] }
          : item,
      ),
    );
    inputRef.current?.focus();
    form.setFieldValue("inputNote", "");
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
        <Form.Item name="inputNote" label={actualTime}>
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
        <Notes
          notes={notes}
          selectedIds={selectedIds}
          onToggleSelection={toggleSelection}
        />
        <div ref={noteEndRef} aria-hidden="true" />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="pointer-events-auto flex max-w-full items-center gap-0.5 rounded-full bg-white/90 px-1 py-1.5 shadow-lg shadow-zinc-950/10 ring-1 ring-zinc-950/10 backdrop-blur dark:bg-zinc-900/90 dark:shadow-black/30 dark:ring-white/10">
          <div
            className={`overflow-hidden transition-[max-width,opacity,transform] duration-200 ease-out motion-reduce:transition-none ${
              hasSelection
                ? "max-w-[6.25rem] translate-y-0 opacity-100"
                : "max-w-0 translate-y-1 opacity-0"
            }`}
          >
            <button
              type="button"
              aria-hidden={!hasSelection}
              tabIndex={hasSelection ? 0 : -1}
              className="group grid w-[6.25rem] rounded-full px-2 py-1.5 text-sm font-medium tabular-nums text-zinc-500 hover:bg-zinc-950/5 hover:text-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/40 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100"
              onClick={clearSelection}
            >
              <span className="col-start-1 row-start-1 group-hover:invisible group-focus-visible:invisible">
                {selectedCount} selected
              </span>
              <span className="invisible col-start-1 row-start-1 group-hover:visible group-focus-visible:visible">
                Deselect
              </span>
            </button>
          </div>
          <button
            type="button"
            disabled={!hasNotes}
            aria-label={isCopied ? "Copied notes for Miro" : "Copy notes for Miro"}
            className="grid w-[5.5rem] rounded-full px-2 py-1.5 text-sm font-medium text-zinc-600 transition-colors duration-150 ease-out hover:bg-zinc-950/5 disabled:cursor-default disabled:text-zinc-300 disabled:hover:bg-transparent dark:text-zinc-300 dark:hover:bg-white/10 dark:disabled:text-zinc-700 dark:disabled:hover:bg-transparent"
            onClick={copyForMiro}
            title={`Copy ${actionScopeLabel} notes for Miro`}
          >
            <span
              aria-hidden={isCopied}
              className={`col-start-1 row-start-1 inline-flex items-center justify-center gap-1.5 transition-[opacity,filter,transform] duration-150 ease-out motion-reduce:transition-none ${
                isCopied
                  ? "translate-y-0.5 opacity-0 blur-sm"
                  : "translate-y-0 opacity-100 blur-0"
              }`}
            >
              <CopyOutlined aria-hidden="true" />
              Miro
            </span>
            <span
              aria-hidden={!isCopied}
              className={`col-start-1 row-start-1 inline-flex items-center justify-center gap-1.5 transition-[opacity,filter,transform] duration-150 ease-out motion-reduce:transition-none ${
                isCopied
                  ? "translate-y-0 opacity-100 blur-0"
                  : "-translate-y-0.5 opacity-0 blur-sm"
              }`}
            >
              <CheckOutlined aria-hidden="true" />
              Copied
            </span>
          </button>
          <button
            type="button"
            disabled={!hasNotes}
            className="inline-flex items-center justify-center gap-1.5 rounded-full py-1.5 pl-1.5 pr-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-950/5 disabled:cursor-default disabled:text-zinc-300 disabled:hover:bg-transparent dark:text-zinc-300 dark:hover:bg-white/10 dark:disabled:text-zinc-700 dark:disabled:hover:bg-transparent"
            onClick={downloadCsv}
            title={`Download ${actionScopeLabel} notes as CSV`}
          >
            <DownloadOutlined aria-hidden="true" />
            CSV
          </button>
          <div
            className={`overflow-hidden transition-[max-width,opacity,transform] duration-200 ease-out motion-reduce:transition-none ${
              hasSelection
                ? "max-w-[5.25rem] translate-y-0 opacity-100"
                : "max-w-0 translate-y-1 opacity-0"
            }`}
          >
            <button
              type="button"
              aria-hidden={!hasSelection}
              tabIndex={hasSelection ? 0 : -1}
              className="inline-flex w-[5.25rem] items-center justify-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1.5 text-sm font-medium tabular-nums text-red-700 ring-1 ring-red-700/10 hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-300/10 dark:hover:bg-red-900/50"
              onClick={removeSelected}
            >
              <DeleteOutlined aria-hidden="true" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
