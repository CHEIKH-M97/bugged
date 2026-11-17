import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],

    // Relative asset paths so the same build works on GitHub Pages
    // (served from /bugged/), on any other host, and with `vite preview`.
    base: "./",

    worker: {
        format: "es"
    },

    server: {
        port: 5173
    },

    test: {
        environment: "node",
        include: ["tests/**/*.test.js"]
    }
});
