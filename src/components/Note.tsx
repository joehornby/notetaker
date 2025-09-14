import { DeleteOutlined } from "@ant-design/icons";
import { useAtom } from "jotai";
import { noteAtomFamily } from "../atoms";

interface NoteProps {
  id: string;
  remove: (id: string) => void;
}

export const Note = ({ id, remove }: NoteProps) => {
  const [note] = useAtom(noteAtomFamily({ id }));
  
  return (
    <>
      <div className="flex w-full justify-between">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {note.timestamp}
        </span>
        <DeleteOutlined
          className="w-8 cursor-pointer text-gray-400 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          onClick={() => remove(id)}
        />
      </div>
      <span className="inline-block w-full text-gray-900 dark:text-gray-100">
        {note.noteText}
      </span>
    </>
  );
};
