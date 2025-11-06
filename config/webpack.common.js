const path = require("path");
const { UserscriptPlugin } = require("webpack-userscript");
const packageJson = require("../package.json");

module.exports = {
  entry: path.resolve(__dirname, "..", "src", "index.js"),
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              [
                "@babel/preset-env",
                {
                  targets: {
                    browsers: ["chrome >= 60", "firefox >= 55", "edge >= 79"]
                  },
                  modules: "commonjs"
                }
              ]
            ]
          }
        }
      }
    ]
  },
  // Don't include any plugins here - they should be added in specific configurations
};