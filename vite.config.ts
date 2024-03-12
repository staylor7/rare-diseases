import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  return {
    base:
      mode === "development"
        ? "http://localhost:5173/rare-diseases"
        : "http://localhost:4173/rare-diseases",
    build: {
      target: "esnext",
    },
  };
});
