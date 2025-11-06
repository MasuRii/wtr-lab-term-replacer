const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const path = require("path");
const { UserscriptPlugin } = require("webpack-userscript");
const packageJson = require("../package.json");

module.exports = merge(common, {
  mode: "none", // 'none' is best for readable output without dev helpers
  output: {
    path: path.resolve(__dirname, "..", "dist"),
    filename: "wtr-lab-term-replacer.greasyfork.user.js",
  },
  optimization: {
    minimize: false,
    usedExports: false,
    sideEffects: false,
    concatenateModules: false,
    moduleIds: "named",
    chunkIds: "named",
  },
  plugins: [
    // Overwrite the UserscriptPlugin to remove update/download URLs for GreasyFork
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
        // Note: updateURL and downloadURL are intentionally omitted for GreasyFork
      },
    }),
  ],
});