import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#074CA1",
          600: "#0A58CA",
          500: "#1D6FE0",
          50: "#EEF4FD",
          100: "#DCE8FA",
        },
        ink: {
          DEFAULT: "#101828",
          2: "#344054",
          muted: "#667085",
          faint: "#98A2B3",
        },
        line: {
          DEFAULT: "#EAECF0",
          soft: "#F2F4F7",
        },
        canvas: "#F5F7FA",
      },
      borderRadius: {
        lg2: "20px",
        md2: "18px",
        sm2: "14px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,.05), 0 1px 3px rgba(16,24,40,.03)",
        sheet: "0 -10px 44px rgba(16,24,40,.18)",
        brand: "0 10px 26px -8px rgba(7,76,161,.55)",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Apple SD Gothic Neo",
          "Pretendard",
          "Pretendard Variable",
          "Noto Sans KR",
          "Malgun Gothic",
          "맑은 고딕",
          "system-ui",
          "sans-serif",
        ],
      },
      letterSpacing: {
        tight2: "-0.035em",
        tight3: "-0.045em",
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: ".35" },
        },
        pop: {
          "0%": { transform: "scale(1)" },
          "45%": { transform: "scale(1.42)" },
          "100%": { transform: "scale(1)" },
        },
        flash: {
          "0%": { boxShadow: "0 0 0 3px rgba(10,88,202,.32)", backgroundColor: "#F5F9FF" },
          "70%": { boxShadow: "0 0 0 3px rgba(10,88,202,.12)", backgroundColor: "#FFFFFF" },
          "100%": { boxShadow: "0 1px 2px rgba(16,24,40,.05)" },
        },
        sheetUp: {
          from: { transform: "translateY(102%)" },
          to: { transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        rise: {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: ".45" },
        },
      },
      animation: {
        blink: "blink 2.2s infinite",
        pop: "pop .34s cubic-bezier(.2,1.4,.4,1)",
        flash: "flash 1.6s ease",
        sheetUp: "sheetUp .28s cubic-bezier(.32,.72,0,1)",
        fadeIn: "fadeIn .22s ease",
        rise: "rise .22s ease",
        pulseSoft: "pulseSoft 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
