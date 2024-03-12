import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  return {
    base:
      mode === "development"
        ? "https://localhost:5173/rare-diseases"
        : "https://stephenandrewtaylor.net/rare-test",
    build: {
      target: "esnext",
    },
  };
});
