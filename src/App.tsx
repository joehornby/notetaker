import { Provider } from "jotai";
import { NoteList } from "./components";

import "./App.css";

export default function App() {
  return (
    <Provider>
      <h1 className="m-0 mb-6 whitespace-nowrap text-balance p-0 text-4xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
        NoteTaker
      </h1>
      <NoteList />
    </Provider>
  );
}
