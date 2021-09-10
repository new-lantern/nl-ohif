const webpack = require('webpack');
const { merge } = require('webpack-merge');
const path = require('path');
const webpackCommon = require('./../../../.webpack/webpack.base.js');
const pkg = require('./../package.json');

const ROOT_DIR = path.join(__dirname, './..');
const SRC_DIR = path.join(__dirname, '../src');
const DIST_DIR = path.join(__dirname, '../dist');

module.exports = (env, argv) => {
  const commonConfig = webpackCommon(env, argv, { SRC_DIR, DIST_DIR });

  return merge(commonConfig, {
    devtool: 'source-map',
    stats: {
      colors: true,
      hash: true,
      timings: true,
      assets: true,
      chunks: false,
      chunkModules: false,
      modules: false,
      children: false,
      warnings: true,
    },
    optimization: {
      minimize: true,
      sideEffects: true,
    },
    output: {
      path: ROOT_DIR,
      library: 'OHIFExtDefault',
      libraryTarget: 'umd',
      libraryExport: 'default',
      filename: pkg.main,
    },
    plugins: [
      new webpack.optimize.LimitChunkCountPlugin({
        maxChunks: 1,
      }),
    ],
    externals: {
      react: 'react',
      'react-dom': 'react-dom',
      'react-router': 'react-router',
      'react-router-dom': 'react-router-dom',
      'cornerstone-core': {
        commonjs: 'cornerstone-core',
        commonjs2: 'cornerstone-core',
        amd: 'cornerstone-core',
        root: 'cornerstone',
      },
      'cornerstone-tools': {
        commonjs: 'cornerstone-tools',
        commonjs2: 'cornerstone-tools',
        amd: 'cornerstone-tools',
        root: 'cornerstoneTools',
      },
      'cornerstone-math': {
        commonjs: 'cornerstone-math',
        commonjs2: 'cornerstone-math',
        amd: 'cornerstone-math',
        root: 'cornerstoneMath',
      },
      '@ohif/core': '@nl/ohif-core',
      '@ohif/ui': '@nl/ohif-ui',
      '@ohif/i18n': '@nl/ohif-i18n',
      '@state': '@state',
    },
  });
};
