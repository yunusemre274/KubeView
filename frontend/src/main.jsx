import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import WorkspaceProvider from "./context/WorkspaceProvider.jsx";
import "./index.css";

const tree = (
  <React.StrictMode>
    <WorkspaceProvider>
      <App />
    </WorkspaceProvider>
  </React.StrictMode>
);
ReactDOM.createRoot(document.getElementById("root")).render(
  import.meta.env.VITE_REACT_PROFILE === "1" ? (
    <React.Profiler
      id="App"
      onRender={(...values) =>
        globalThis.__KUBEVIEW_BENCHMARK__?.reactCommit?.(...values)
      }
    >
      {tree}
    </React.Profiler>
  ) : (
    tree
  ),
);
