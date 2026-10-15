import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig, type Plugin } from "vite";

const reloadOnNotes: Plugin = {
  name: "reload-on-notes",
  configureServer(server) {
    server.watcher.on("change", (file) => {
      if (/\/(aircraft|shared)\/.+\.md$/.test(file)) server.environments.client.hot.send({ type: "full-reload" });
    });
  },
};

export default defineConfig({
  plugins: [sveltekit(), reloadOnNotes],
});
