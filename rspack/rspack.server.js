const path = require('path');
const HotReloadPlugin = require('./rspack.hot-reload');
const { TsCheckerRspackPlugin } = require('ts-checker-rspack-plugin');

// @ts-check
/** @type {import('@rspack/cli').Configuration} */
module.exports = () => ({
  name: 'server',
  entry: path.resolve('./src/server/server.ts'),
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
  externalsPresets: {
    node: true,
  },
  plugins: [
    new HotReloadPlugin('server'),
    // new TsCheckerRspackPlugin({
    //   typescript: {
    //     typescriptPath: require.resolve('typescript'),
    //     configFile: path.resolve('./src/server/tsconfig.json'),
    //   },
    // }),
  ].filter(Boolean),
  optimization: {
    minimize: false,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    tsConfig: { configFile: path.resolve('./src/server/tsconfig.json') },
  },
  output: {
    path: path.resolve('./build'),
    filename: 'server.js',
  },
  target: 'node',
});
