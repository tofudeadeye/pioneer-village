const path = require('path');
const HotReloadPlugin = require('./rspack.hot-reload');
const { TsCheckerRspackPlugin } = require('ts-checker-rspack-plugin');

// @ts-check
/** @type {import('@rspack/cli').Configuration} */
module.exports = () => ({
  name: 'client',
  entry: path.resolve('./src/client/client.ts'),
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: [/node_modules/, /build/],
        loader: 'builtin:swc-loader',
        options: {
          jsc: {
            parser: {
              syntax: 'typescript',
            },
          },
        },
        type: 'javascript/auto',
      },
    ],
  },
  plugins: [
    new HotReloadPlugin('client'),
    // new TsCheckerRspackPlugin({
    //   typescript: {
    //     typescriptPath: require.resolve('typescript'),
    //     configFile: path.resolve('./src/client/tsconfig.json'),
    //   },
    // }),
  ],
  optimization: {
    minimize: false,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    tsConfig: { configFile: path.resolve('./src/client/tsconfig.json') },
  },
  output: {
    path: path.resolve('./build'),
    filename: 'client.js',
  },
  performance: {
    hints: false,
  },
});
