import { CheckOutlined } from "@ant-design/icons";
import { useAtom } from "jotai";
import { noteAtomFamily } from "../atoms";

interface NoteProps {
  id: string;
  isSelected: boolean;
  onToggleSelection: (id: string) => void;
}

export const Note = ({ id, isSelected, onToggleSelection }: NoteProps) => {
  const [note] = useAtom(noteAtomFamily({ id }));

  return (
    <>
      <div className="flex w-full items-start justify-between gap-4">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          {note.timestamp}
        </p>
        <button
          type="button"
          aria-label={isSelected ? "Deselect note" : "Select note"}
          aria-pressed={isSelected}
          className={`inline-flex size-8 shrink-0 items-center justify-center rounded-md ring-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/40 ${
            isSelected
              ? "bg-zinc-900 text-white ring-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 dark:ring-zinc-100"
              : "text-zinc-400 ring-zinc-950/10 hover:bg-zinc-950/5 hover:text-zinc-700 dark:text-zinc-500 dark:ring-white/10 dark:hover:bg-white/10 dark:hover:text-zinc-200"
          }`}
          onClick={() => onToggleSelection(id)}
        >
          {isSelected ? <CheckOutlined aria-hidden="true" /> : null}
        </button>
      </div>
      <p className="w-full whitespace-pre-wrap text-pretty text-base text-zinc-900 dark:text-zinc-100">
        {note.noteText}
      </p>
    </>
  );
};
