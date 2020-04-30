const webpack = require("webpack");
const path = require("path");

module.exports = {
  mode: "development",
  entry: {
    demo: "./mobile_demo/index.js",
  },
  output: {
    path: path.resolve("build"),
    publicPath: "/",
    filename: "[name].js",
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: "babel-loader",
      },
      {
        test: /\.less$/,
        use: ["style-loader", "css-loader", "less-loader"],
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.svg$/,
        use: ["@svgr/webpack"],
      },
    ],
  },
  plugins: [
    new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /zh-cn/),
  ],
  devServer: {
    compress: true,
    host: "0.0.0.0",
    inline: false,
    disableHostCheck: true,
  },
};
