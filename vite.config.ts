import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  return {
    base:
      mode === "development"
        ? "/"
        : "http://www.stephenandrewtaylor.net/rare-diseases/index.html",
  };
});
