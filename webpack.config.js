const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  mode: "development",
  entry: {
    navigateLinksScriptFilter: './src/navigateLinksScriptFilter.ts',
    actionScriptFilter: './src/actionScriptFilter.ts',
    app: './src/pages/index.js',
  },
  target: "node",
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      },
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'alfred-workflow'),
  },
  plugins: [
    new HtmlWebpackPlugin({
      chunks: ["app"],
      template: './src/pages/index.html'
    }),
  ]
};
