/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter", "sans-serif"],
      },
      keyframes: {
        aurora: {
          "0%": {
            backgroundPosition: "0% 50%, 50% 50%",
          },
          "50%": {
            backgroundPosition: "100% 50%, 0% 50%",
          },
          "100%": {
            backgroundPosition: "0% 50%, 50% 50%",
          },
        },
      },
      animation: {
        aurora: "aurora 18s ease-in-out infinite alternate",
      },
    },
  },
  plugins: [],
};
