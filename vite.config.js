import { defineConfig } from "vite";

// vite.config.js
export default defineConfig({
  // config options
  base: "http://stephenandrewtaylor.net/rare-diseases/",
  server: {
    noExternal: true,
  },
});
