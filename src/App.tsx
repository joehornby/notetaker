import { Provider } from "jotai";
import { NoteList } from "./components";

import "./App.css";

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
