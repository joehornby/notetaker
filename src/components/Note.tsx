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
      <div className="flex w-full items-start justify-between gap-4">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          {note.timestamp}
        </p>
        <button
          type="button"
          aria-label="Delete note"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-950/5 hover:text-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/40 dark:text-zinc-500 dark:hover:bg-white/10 dark:hover:text-zinc-200"
          onClick={() => remove(id)}
        >
          <DeleteOutlined aria-hidden="true" />
        </button>
      </div>
      <p className="w-full whitespace-pre-wrap text-pretty text-base text-zinc-900 dark:text-zinc-100">
        {note.noteText}
      </p>
    </>
  );
};
