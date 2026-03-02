export default {
  plugins: {
    "@stylexjs/postcss-plugin": {
      include: ["./**/*.{js,jsx,ts,tsx}"],
      useCSSLayers: true,
    },
    autoprefixer: {},
  },
};
