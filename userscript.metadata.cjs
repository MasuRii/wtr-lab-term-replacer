const pkg = require("./package.json");
const { getVersion } = require("./config/versions.js");

const REPOSITORY_URL = pkg.repository.url.replace(/\.git$/, "");
const RAW_DIST_URL = `${REPOSITORY_URL.replace("https://github.com/", "https://raw.githubusercontent.com/")}/main/dist`;

const SCRIPT_NAME = "WTR Lab Term Replacer";
// Keep the historical package/artifact name so existing installs keep receiving updates.
const PACKAGE_NAME = pkg.name;

const COMMON_META = {
  description: pkg.description,
  author: pkg.author,
  license: pkg.license,
  namespace: REPOSITORY_URL,
  match: [
    "https://wtr-lab.com/en/novel/*/*/*",
  ],
  icon: "https://www.google.com/s2/favicons?sz=64&domain=wtr-lab.com",
  connect: [
    "fonts.googleapis.com",
  ],
  grant: [
    "GM_setValue",
    "GM_getValue",
    "GM_listValues",
    "GM_addStyle",
    "GM_registerMenuCommand",
  ],
  "run-at": "document-idle",
  supportURL: pkg.bugs.url,
  homepage: `${REPOSITORY_URL}#readme`,
};

function createPerformanceHeaders() {
  return {
    ...COMMON_META,
    name: SCRIPT_NAME,
    version: getVersion("semantic"),
    downloadURL: `${RAW_DIST_URL}/${PACKAGE_NAME}.user.js`,
    updateURL: `${RAW_DIST_URL}/${PACKAGE_NAME}.meta.js`,
  };
}

function createGreasyForkHeaders() {
  return {
    ...COMMON_META,
    name: SCRIPT_NAME,
    version: getVersion("semantic"),
    // No updateURL/downloadURL for GreasyFork compliance.
  };
}

function createDevHeaders() {
  return {
    ...COMMON_META,
    name: `${SCRIPT_NAME} [DEV]`,
    version: getVersion("dev"),
  };
}

module.exports = {
  COMMON_META,
  PACKAGE_NAME,
  RAW_DIST_URL,
  REPOSITORY_URL,
  SCRIPT_NAME,
  createPerformanceHeaders,
  createGreasyForkHeaders,
  createDevHeaders,
};
