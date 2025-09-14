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
      <div className="metadata">
        <span className="timestamp">{note.timestamp}</span>
        <DeleteOutlined onClick={() => remove(id)} />
      </div>
      <span className="text">{note.noteText}</span>
    </>
  );
};
