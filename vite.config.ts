import { defineConfig } from "vite";
import { nitro } from "nitro/vite";
import vinext from "vinext";

export default defineConfig({
  plugins: [vinext(), nitro()],
});
