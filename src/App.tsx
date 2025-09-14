import { Provider } from "jotai";
import { NoteList } from "./components";

import "./App.css";

export default function App() {
  return (
    <Provider>
      <h1 className="text-5xl leading-tight font-normal m-0 mb-8 p-0 tracking-tight whitespace-nowrap text-gray-900 dark:text-gray-100">
        Note<span className="tracking-tighter">T</span>aker
      </h1>
      <NoteList />
    </Provider>
  );
}
