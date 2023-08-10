import { useAtom } from "jotai";
import { a, useTransition } from "@react-spring/web";
import { notesAtom } from "../atoms";
import { Note } from "./Note";

interface NotesProps {
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
}

export const Notes = ({ selectedIds, onToggleSelection }: NotesProps) => {
  const [notes] = useAtom(notesAtom);
  const transitions = useTransition(notes, {
    keys: (id: string) => id,
    from: {
      filter: "blur(3px)",
      opacity: 0,
      transform: "translate3d(0, -6px, 0) scale(0.995)",
      gridTemplateRows: "0fr",
    },
    enter: {
      filter: "blur(0px)",
      opacity: 1,
      transform: "translate3d(0, 0, 0) scale(1)",
      gridTemplateRows: "1fr",
    },
    leave: () => async (next) => {
      await next({
        filter: "blur(5px)",
        opacity: 0,
        transform: "translate3d(18px, 0, 0) scale(0.985)",
        gridTemplateRows: "1fr",
        config: { tension: 360, friction: 34, clamp: true },
      });

      await next({
        gridTemplateRows: "0fr",
        config: { tension: 260, friction: 19 },
      });
    },
    config: { tension: 240, friction: 26 },
  });

  return (
    <div className="flex flex-col gap-3" role="list">
      {transitions((style, id) => (
        <a.div className="grid" style={style} role="listitem">
          <article
            className={`flex min-h-0 w-full flex-col items-center justify-between gap-3 overflow-hidden rounded-lg border-2 bg-white p-4 shadow-sm dark:bg-zinc-900 ${
              selectedIds.has(id)
                ? "border-zinc-400/70 dark:border-zinc-500"
                : "border-zinc-950/5 dark:border-white/10"
            }`}
          >
            <Note
              id={id}
              isSelected={selectedIds.has(id)}
              onToggleSelection={onToggleSelection}
            />
          </article>
        </a.div>
      ))}
    </div>
  );
};
