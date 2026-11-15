import { mergeConfig } from "vite";
import base from "../vite.config.js";
// Immutable browser measurement session: source edits cannot trigger HMR resets.
export default mergeConfig(base, {
  server: {
    port: 5187,
    strictPort: true,
    hmr: false,
    watch: { ignored: ["**/*"] },
  },
});
