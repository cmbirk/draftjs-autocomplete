import React from "react";
import "draft-js/dist/Draft.css";
import "./App.css";

import AutocompleteEditor from "./components/AutoCompleteEditor";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <div style={{ padding: '2rem' }}>
          <h1>Autocomplete Editor</h1>
          <AutocompleteEditor />
        </div>
      </header>
    </div>
  );
}

export default App;
