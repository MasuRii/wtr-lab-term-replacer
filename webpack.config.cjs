// webpack.config.cjs
// Multi-build configuration for WTR Lab Term Replacer

const path = require("path");
const webpack = require("webpack");
const { UserscriptPlugin } = require("webpack-userscript");
const {
  PACKAGE_NAME,
  createDevHeaders,
  createGreasyForkHeaders,
  createPerformanceHeaders,
} = require("./userscript.metadata.cjs");

// 1. Performance Build (Production)
const performanceConfig = {
  name: "performance",
  mode: "production",
  target: "web",
  entry: "./src/index.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: `${PACKAGE_NAME}.user.js`,
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: "ts-loader",
          options: {
            compilerOptions: {
              noEmit: false,
            },
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  optimization: {
    minimize: true,
    usedExports: true,
    concatenateModules: true,
    splitChunks: {
      chunks: "all",
    },
  },
  plugins: [
    new webpack.DefinePlugin({
      process: '({ env: {} })',
    }),
    new UserscriptPlugin({
      headers: createPerformanceHeaders(),
      proxyScript: false,
    }),
  ],
};

// 2. GreasyFork Build
const greasyforkConfig = {
  name: "greasyfork",
  mode: "production",
  target: "web",
  entry: "./src/index.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: `${PACKAGE_NAME}.greasyfork.user.js`,
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: "ts-loader",
          options: {
            compilerOptions: {
              noEmit: false,
            },
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  optimization: {
    minimize: false,
    usedExports: true,
    concatenateModules: true,
  },
  plugins: [
    new webpack.DefinePlugin({
      process: '({ env: {} })',
    }),
    new UserscriptPlugin({
      headers: createGreasyForkHeaders(),
      proxyScript: false,
    }),
  ],
};

// 3. Development Build
const devConfig = {
  name: "dev",
  mode: "development",
  target: "web",
  entry: "./src/index.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: `${PACKAGE_NAME}.dev.user.js`,
    publicPath: "http://localhost:8080/",
  },
  devServer: {
    static: {
      directory: path.join(__dirname, "dist"),
    },
    port: 8080,
    hot: true,
    liveReload: false,
    client: {
      webSocketURL: "ws://localhost:8080/ws",
      overlay: false,
      logging: "none",
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: "ts-loader",
          options: {
            compilerOptions: {
              noEmit: false,
            },
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  optimization: {
    minimize: false,
    usedExports: true,
    splitChunks: {
      chunks: "all",
    },
  },
  plugins: [
    new webpack.DefinePlugin({
      process: '({ env: {} })',
    }),
    new UserscriptPlugin({
      headers: createDevHeaders(),
      proxyScript: {
        baseUrl: "http://localhost:8080",
        filename: "[basename].proxy.user.js",
        enable: true,
      },
    }),
  ],
};

// Export all configurations
module.exports = [performanceConfig, greasyforkConfig, devConfig];