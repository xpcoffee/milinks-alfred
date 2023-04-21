const path = require('path');

module.exports = {
  mode: "development",
  entry: {
    navigate: './src/navigateLinksScriptFilter.ts'
  },
  target: "node",
  module: {
    rules: [
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
};
