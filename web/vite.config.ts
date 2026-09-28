import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";

const webDir = path.dirname(fileURLToPath(import.meta.url));
const netraSource = path.resolve(webDir, "../src/index.ts");

export default defineConfig({
  resolve: {
    alias: {
      netra: netraSource,
    },
  },
  plugins: [
    vinext(),
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
});
