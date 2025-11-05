import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        light: {
          primary: "#2589fb", // blue-500
          secondary: "#f42200", // violet-500
          accent: "#06b6d4", // cyan-500
          neutral: "#1f2937", // gray-800
          "base-100": "#ffffff", // white background
          "base-200": "#f3f4f6", // gray-100
          "base-300": "#e5e7eb", // gray-200
          "text-primary-color": "#000000",
          opposite: "#000000",
          fill: "#000000",
          info: "#38B9FA",
          success: "#28BD5A",
          warning: "#F5B83D",
          error: "#DD3C57",
        },
      },
      {
        dark: {
          primary: "#2589fb",
          secondary: "#f42200", // violet-400
          accent: "#22d3ee", // cyan-400
          neutral: "#1f2937", // gray-800
          "base-100": "#1E2128FF", // background
          "base-200": "#1f2937", // gray-800
          "base-300": "#374151", // gray-700
          "text-primary-color": "#ffffff",
          opposite: "#ffffff",
          fill: "#ffffff",
          info: "#38B9FA",
          success: "#28BD5A",
          warning: "#F5B83D",
          error: "#DD3C57",
        },
      },
    ],
  },
};
