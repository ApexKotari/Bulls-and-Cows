/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./script.js"],
  theme: {
    extend: {
      colors: {
        custom: "rgb(10,25,47)",
        customBlue: "#3b82f6",
      },
      boxShadow: {
        "blue-ring": "0 0 0 2px rgba(59, 130, 246, 0.5)",
      },
    },
  },
  plugins: [],
};
