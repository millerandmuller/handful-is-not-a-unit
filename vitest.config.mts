import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Lets tests import files that use the "@/..." shortcut, as the app does.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./", import.meta.url)) } },
});
