import { useEffect, useRef, useState } from "react";
import { Input, Form } from "antd";
import type { InputRef } from "antd";
import { useAtom, useSetAtom } from "jotai";
import { nanoid } from "nanoid";
import { noteAtomFamily, notesAtom, serializeAtom } from "../atoms";
import { Notes } from "./Notes";

export const NoteList = () => {
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
    const updateClock = () => {
      setActualTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };

    updateClock();

    const interval = setInterval(() => {
      updateClock();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Form
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
            style={{ width: "100%", height: 120, resize: "none" }}
            bordered={false}
            placeholder="Type notes ..."
          />
        </Form.Item>
      </Form>
      <div style={{ overflow: "scroll", height: 300 }}>
        <Notes remove={remove} />
      </div>
    </>
  );
};
