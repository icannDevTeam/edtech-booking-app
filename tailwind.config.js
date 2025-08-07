module.exports = {
  content: [
    './index.html',
    './backend/**/*.js',
    './asset/**/*.js',
    // Exclude node_modules explicitly for safety
    '!./node_modules',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
