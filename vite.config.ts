import { defineConfig } from "vite";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig(({ mode }) => {
  return {
    build: {
      target: "esnext",
      sourcemap: true, // false for "true" production (non-staging)
    },
    plugins: mode === "development" ? [basicSsl()] : [],
  };
});
