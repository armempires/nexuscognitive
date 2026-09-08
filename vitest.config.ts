import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templateRoot = __dirname;

export default defineConfig({
  root: templateRoot,
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "client", "src"),
      "@shared": path.resolve(templateRoot, "shared"),
      "@assets": path.resolve(templateRoot, "attached_assets"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["server/**/*.test.ts", "server/**/*.spec.ts", "client/src/**/*.test.ts", "client/src/**/*.test.tsx", "client/src/**/*.spec.ts", "client/src/**/*.spec.tsx"],
  },
});
