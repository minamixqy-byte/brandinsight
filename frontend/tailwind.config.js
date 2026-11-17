/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F7F5F4",
        panel: "#FFFFFF",
        line: "#E2DCDA",
        rose: "#A95E6F",
        "rose-soft": "#F4E7EA",
        plum: "#38262B",
        ink: "#211D1E",
        muted: "#675F60",
        success: "#648A72",
        warning: "#9A6C3E",
        accent: "#A95E6F",
        "accent-soft": "#F4E7EA",
        navy: "#2D2225",
        "slate-soft": "#F2EFEE"
      },
      fontFamily: {
        sans: ["Noto Sans SC", "PingFang SC", "Microsoft YaHei", "system-ui", "sans-serif"],
        metric: ["SF Pro Display", "PingFang SC", "system-ui", "sans-serif"]
      },
      boxShadow: {
        soft: "0 18px 50px rgba(56, 38, 43, 0.09)",
        lift: "0 24px 70px rgba(56, 38, 43, 0.13)"
      }
    }
  },
  plugins: []
};
