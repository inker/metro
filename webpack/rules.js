const { createLodashTransformer } = require('typescript-plugin-lodash')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { compact } = require('lodash')

const lodashTransformer = createLodashTransformer()

const tsOptions = (isDev) => isDev ? {} : {
  getCustomTransformers: () => ({
    before: [
      lodashTransformer,
    ],
  }),
  ignoreDiagnostics: [],
}

const getCssLoader = global => global ? 'css-loader' : {
  loader: 'css-loader',
  options: {
    esModule: false,
    modules: {
      localIdentName: '[path]___[name]__[local]___[hash:base64:5]',
    },
    importLoaders: 1,
  },
}

const getCssRule = (isDev, global) => [
  isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
  getCssLoader(global),
  'postcss-loader',
]

module.exports = (isDev) => compact([
  // { // adds source maps for external modules (like bim)
  //   enforce: 'pre',
  //   test: /\.js$/,
  //   use: 'source-map-loader',
  // },
  {
    test: /\.tsx?$/,
    use: {
      loader: 'ts-loader',
      options: tsOptions(isDev),
    },
    exclude: /node_modules/,
  },
  { // non-global
    test: /\.pcss$/,
    use: getCssRule(isDev, false),
    exclude: /node_modules/,
  },
  { // global
    test: /\.css$/,
    use: getCssRule(isDev, true),
  },
  {
    test: /\.(png|jpe?g|gif|svg)$/,
    type: 'asset/resource',
    generator: {
      filename: 'images/[name].[contenthash][ext]',
    },
  },
])
