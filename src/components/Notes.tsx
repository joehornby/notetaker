import { useAtom } from "jotai";
import { a, useTransition } from "@react-spring/web";
import { notesAtom } from "../atoms";
import { Note } from "./Note";

interface NotesProps {
  remove: (id: string) => void;
}

export const Notes = ({ remove }: NotesProps) => {
  const [notes] = useAtom(notesAtom);
  const transitions = useTransition(notes, {
    keys: (id: string) => id,
    from: { opacity: 0, height: 0 },
    enter: { opacity: 1, height: "auto" },
    leave: { opacity: 0, height: 0 },
  });
  
  return (
    <>
      {transitions((style, id) => (
        <a.div
          className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md relative flex flex-col w-full items-center justify-between gap-2 overflow-hidden mb-2"
          style={style}
        >
          <Note id={id} remove={remove} />
        </a.div>
      ))}
    </>
  );
};
