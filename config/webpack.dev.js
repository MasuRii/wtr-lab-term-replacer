const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const path = require("path");
const { UserscriptPlugin } = require("webpack-userscript");
const packageJson = require("../package.json");
const { versionManager, VERSION_INFO } = require("../config/versions.js");

module.exports = merge(common, {
  mode: "development",
  devtool: "inline-source-map",
  output: {
    path: path.resolve(__dirname, "..", "dist"),
    filename: `wtr-lab-term-replacer.${versionManager.getSemanticVersion()}.dev.user.js`,
  },
  devServer: {
    static: {
      directory: path.join(__dirname, "..", "dist"),
    },
    port: 9000,
    hot: false, // Userscript hot-reloading is handled by the proxy
    liveReload: false,
  },
  plugins: [
    new UserscriptPlugin({
      headers: {
        name: "WTR Lab Term Replacer",
        version: versionManager.getDisplayVersion(),
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
        updateURL: `${packageJson.homepage}/raw/main/dist/wtr-lab-term-replacer.${versionManager.getSemanticVersion()}.performance.meta.js`,
        downloadURL: `${packageJson.homepage}/raw/main/dist/wtr-lab-term-replacer.${versionManager.getSemanticVersion()}.performance.user.js`,
      },
      proxyScript: {
        baseUrl: "http://localhost:9000/",
        filename: "[basename].proxy.user.js",
        enable: true,
      },
    }),
  ],
});