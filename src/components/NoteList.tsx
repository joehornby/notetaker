import { CopyOutlined, DownloadOutlined } from "@ant-design/icons";
import { useEffect, useRef, useState } from "react";
import { Form, Input } from "antd";
import type { InputRef } from "antd";
import { useAtom } from "jotai";
import { nanoid } from "nanoid";
import { noteAtomFamily, notesAtom, serializeAtom } from "../atoms";
import type { SerializedData } from "../types";
import { Notes } from "./Notes";

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

export const NoteList = () => {
  const [form] = Form.useForm();
  const inputRef = useRef<InputRef>(null);
  const [notes, setNotes] = useAtom(notesAtom);
  const [copyLabel, setCopyLabel] = useState("Copy for Miro");

  const remove = (id: string) => {
    setNotes((prev) => prev.filter((note) => note !== id));
    noteAtomFamily.remove({ id });
  };

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

  const copyForMiro = async () => {
    const data = getSerializedData();
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
    const csv = buildNotesCsv(getSerializedData());
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
    <div className="flex min-h-0 flex-1 flex-col">
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
      <div className="flex shrink-0 items-center justify-end gap-2 pb-3">
        <button
          type="button"
          disabled={notes.length === 0}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-zinc-600 ring-1 ring-zinc-950/10 hover:bg-white disabled:cursor-default disabled:text-zinc-300 disabled:hover:bg-transparent dark:text-zinc-300 dark:ring-white/10 dark:hover:bg-white/10 dark:disabled:text-zinc-700 dark:disabled:hover:bg-transparent"
          onClick={copyForMiro}
        >
          <CopyOutlined aria-hidden="true" />
          {copyLabel}
        </button>
        <button
          type="button"
          disabled={notes.length === 0}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-zinc-600 ring-1 ring-zinc-950/10 hover:bg-white disabled:cursor-default disabled:text-zinc-300 disabled:hover:bg-transparent dark:text-zinc-300 dark:ring-white/10 dark:hover:bg-white/10 dark:disabled:text-zinc-700 dark:disabled:hover:bg-transparent"
          onClick={downloadCsv}
        >
          <DownloadOutlined aria-hidden="true" />
          Download .CSV
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <Notes remove={remove} />
      </div>
    </div>
  );
};
