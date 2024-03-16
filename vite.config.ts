import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  return {
    base:
      mode === "development"
        ? "http://localhost:5173/rare-diseases" // Development, local
        : // : "https://stephenandrewtaylor.net/rare-test", // Production, staging
          "http://localhost:4173/rare-test", // Production, local
    build: {
      target: "esnext",
      outDir: "rare-test",
      sourcemap: true, // false for "true" production (non-staging)
    },
  };
});
