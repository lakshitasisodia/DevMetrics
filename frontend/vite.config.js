import { defineConfig } from "vite";
import { resolve } from "path";

const root = import.meta.dirname;

export default defineConfig({
  root: ".",
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: resolve(root, "index.html"),
        register: resolve(root, "register.html"),
        connect: resolve(root, "connect.html"),
        repositories: resolve(root, "repositories.html"),
        dashboard: resolve(root, "dashboard.html"),
        repo: resolve(root, "repo.html"),
      },
    },
  },
  server: {
    port: 5173,
  },
});
