import { useEffect, useRef, useState } from "react";
import { CloseOutlined, DeleteOutlined } from "@ant-design/icons";
import { Input, Form } from "antd";
import type { InputRef } from "antd";
import { a, useTransition } from "@react-spring/web";
import { Provider, atom, useAtom, useSetAtom } from "jotai";
import { atomFamily } from "jotai/utils";
import { nanoid } from "nanoid";

import "./App.css";

type Param = { id: string; noteText?: string };
const noteAtomFamily = atomFamily(
  (param: Param) =>
    atom({
      noteText:
        param.noteText ||
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi vitae ipsum nec odio iaculis rutrum. Maecenas condimentum neque et leo interdum, vitae accumsan massa porta. Proin dignissim varius odio, vel mollis justo venenatis sit amet.",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    }),
  (a: Param, b: Param) => a.id === b.id
);

const notesAtom = atom<string[]>([]);

const Note = ({ id, remove }: { id: string; remove: (id: string) => void }) => {
  const [note, setNote] = useAtom(noteAtomFamily({ id }));
  return (
    <>
      <div className="metadata">
        <span className="timestamp">{note.timestamp}</span>
        <DeleteOutlined onClick={() => remove(id)} />
      </div>
      <span className="text">{note.noteText}</span>
    </>
  );
};

const Notes = ({ remove }: { remove: (id: string) => void }) => {
  const [notes] = useAtom(notesAtom);
  const transitions = useTransition(notes, {
    keys: (id: string) => id,
    from: { opacity: 0, height: 0 },
    enter: { opacity: 1, height: "auto" },
    leave: { opacity: 0, height: 0 },
  });
  return transitions((style, id) => (
    <a.div className="note" style={style}>
      <Note id={id} remove={remove} />
    </a.div>
  ));
};

const NoteList = () => {
  const [form] = Form.useForm();
  const inputRef = useRef<InputRef>(null);
  const setNotes = useSetAtom(notesAtom);

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

  const add = (values: any) => {
    // e.preventDefault();
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
    })
  );
  useEffect(() => {
    const update = () => {
      setActualTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };

    update();

    const interval = setInterval(() => {
      update();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Form
        onKeyPress={(e) => {
          if (e.key === "Enter" && e.shiftKey == false) {
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
          style={{ fontSize: "0.8rem", color: "#c0c0c0" }}
        >
          <Input.TextArea
            ref={inputRef}
            rows={4}
            style={{ width: "100%", height: 120, resize: "none" }}
            bordered={false}
            placeholder="Type notes ..."
          />
        </Form.Item>
      </Form>
      <Notes remove={remove} />
    </>
  );
};

const serializeAtom = atom<
  null,
  | { type: "serialize"; callback: (value: string) => void }
  | { type: "deserialize"; value: string }
>(null, (get, set, action) => {
  if (action.type === "serialize") {
    const notes = get(notesAtom);
    const noteMap: Record<string, { noteText: string; timestamp: string }> = {};
    notes.forEach((id) => {
      noteMap[id] = get(noteAtomFamily({ id }));
    });
    const obj = {
      notes,
      noteMap,
    };
    action.callback(JSON.stringify(obj));
  } else if (action.type === "deserialize") {
    const obj = JSON.parse(action.value);
    obj.notes.forEach((id: string) => {
      const note = obj.noteMap[id];
      set(noteAtomFamily({ id, ...note }), note);
    });
    set(notesAtom, obj.notes);
  }
});

export default function App() {
  return (
    <Provider>
      <h1>
        Note<span className="T">T</span>aker
      </h1>
      <NoteList />
    </Provider>
  );
}
