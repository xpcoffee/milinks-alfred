const path = require('path');

module.exports = {
  mode: "production",
  entry: './src/index.ts',
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
    fallback: {
      "os": false,
      "fs": false,
      "path": false,
    }
  },
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'alfred-workflow'),
  },
};
