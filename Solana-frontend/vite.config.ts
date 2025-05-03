import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: [
        "buffer",
        "process",
        "stream",
        "http",
        "https",
        "os",
        "url",
        "zlib",
        "assert",
        "crypto",
      ],
      globals: {
        Buffer: true,
        process: true,
        global: true,
      },
    }),
  ],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "esnext",
    },
    include: ["buffer", "process"],
  },
  resolve: {
    alias: {
      buffer: "buffer",
      process: "process",
      stream: "stream-browserify",
      http: "stream-http",
      https: "https-browserify",
      os: "os-browserify",
      url: "url",
      zlib: "zlib-browserify",
      assert: "assert",
      crypto: "crypto-browserify",
    },
  },
  define: {
    global: "globalThis",
    "process.env": {},
  },
  build: {
    rollupOptions: {
      plugins: [],
      output: {
        manualChunks: {
          vendor: [
            "buffer",
            "process",
            "stream-browserify",
            "stream-http",
            "https-browserify",
            "os-browserify",
            "url",
            "zlib-browserify",
            "assert",
            "crypto-browserify",
          ],
        },
      },
    },
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    sourcemap: true,
  },
});
