/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "@tailwindcss/postcss": {
      plugins: ["tailwindcss-animate"],
      config: "./tailwind.config.js",
    },
  },
};

export default config;
