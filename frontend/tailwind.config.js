/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#FAF8F7",
        panel: "#FFFFFF",
        line: "#EAE3E1",
        rose: "#B77D87",
        "rose-soft": "#F5E8E9",
        plum: "#4A3036",
        ink: "#282323",
        muted: "#817878",
        success: "#648A72",
        warning: "#9A6C3E",
        accent: "#A96673",
        "accent-soft": "#F5E8E9",
        navy: "#3A2A2D",
        "slate-soft": "#F7F3F2"
      },
      fontFamily: {
        sans: ["Noto Sans SC", "PingFang SC", "Microsoft YaHei", "system-ui", "sans-serif"],
        metric: ["SF Pro Display", "PingFang SC", "system-ui", "sans-serif"]
      },
      boxShadow: {
        soft: "0 18px 50px rgba(74, 48, 54, 0.10)"
      }
    }
  },
  plugins: []
};
