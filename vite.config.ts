import { defineConfig } from "vite";

export default defineConfig(() => {
  return {
    build: {
      target: "esnext",
      sourcemap: true, // false for "true" production (non-staging)
    },
  };
});
