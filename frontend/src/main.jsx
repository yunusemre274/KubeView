import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { ShipyardClusterProvider } from "./context/ShipyardClusterContext.jsx";
import "./index.css";

const tree = (
  <React.StrictMode>
    <ShipyardClusterProvider>
      <App />
    </ShipyardClusterProvider>
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
