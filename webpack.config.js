const path = require('path');
const webpack = require('webpack');

/** @type {import('webpack').Configuration} */
module.exports = {
  target: 'node14',
  entry: './src/cli.ts',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'ydropp.js',
  },
  resolve: { extensions: ['.ts', '.js'] },
  module: {
    rules: [
      { test: /\.ts$/, loader: 'ts-loader', exclude: /node_modules/, options: { configFile: 'tsconfig.json', transpileOnly: true } },
      { test: /\.html$/, type: 'asset/source' },
    ],
  },
  plugins: [new webpack.BannerPlugin({ banner: '#!/usr/bin/env node', raw: true })],
  optimization: { minimize: false },
  // express/lib/view.js charge dynamiquement des moteurs de templates (non utilisés ici).
  ignoreWarnings: [{ module: /express[\\/]lib[\\/]view\.js/ }],
  stats: 'errors-warnings',
};
