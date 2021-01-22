const path = require("path");

/**
 * @type { import ('webpack').Configuration }
 */
module.exports = {
  mode: "none",
  entry: path.resolve(__dirname, "src/main.js"),
  module: {
    rules: [
      {
        test: /.js$/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
            plugins: [
              [
                "@babel/plugin-transform-react-jsx",
                { pragma: "createElement" },
              ],
            ],
          },
        },
      },
    ],
  },
};
