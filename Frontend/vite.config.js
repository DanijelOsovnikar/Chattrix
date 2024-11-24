import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // proxy: {
    //   "/api": {
    //     target: "http://localhost:3000",
    //     changeOrigin: true,
    //     secure: false,
    //     timeout: 10000, // Increase timeout to 10 seconds (default is 5 seconds)
    //   },
    // },
  },
});
