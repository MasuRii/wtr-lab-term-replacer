const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const path = require("path");
const { UserscriptPlugin } = require("webpack-userscript");
const packageJson = require("../package.json");

module.exports = merge(common, {
  mode: "production",
  output: {
    path: path.resolve(__dirname, "..", "dist"),
    filename: "wtr-lab-term-replacer.performance.user.js",
  },
  optimization: {
    minimize: true,
    usedExports: true,
    sideEffects: false,
    concatenateModules: true,
    moduleIds: "deterministic",
    chunkIds: "deterministic",
  },
  plugins: [
    new UserscriptPlugin({
      headers: {
        name: "WTR Lab Term Replacer",
        version: packageJson.version,
        description: packageJson.description,
        author: packageJson.author,
        license: packageJson.license,
        namespace: "http://tampermonkey.net/",
        match: "https://wtr-lab.com/en/novel/*/*/*",
        "run-at": "document-idle",
        grant: [
          "GM_setValue",
          "GM_getValue",
          "GM_listValues",
          "GM_addStyle",
          "GM_registerMenuCommand",
        ],
        icon: "https://www.google.com/s2/favicons?sz=64&domain=wtr-lab.com",
        updateURL: `${packageJson.homepage}/raw/main/dist/wtr-lab-term-replacer.performance.meta.js`,
        downloadURL: `${packageJson.homepage}/raw/main/dist/wtr-lab-term-replacer.performance.user.js`,
      },
    }),
  ],
});