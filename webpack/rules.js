const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const { createLodashTransformer } = require('typescript-plugin-lodash')

const tsOptions = env => env === 'dev' ? {
  // getCustomTransformers: () => ({ before: [styledComponentsTransformer] }),
  useCache: true,
} : {
  ignoreDiagnostics: [],
  getCustomTransformers: () => ({ before: [createLodashTransformer()] }),
}

const getCssLoader = global => global ? 'css-loader' : {
  loader: 'css-loader',
  options: {
    modules: true,
    importLoaders: 1,
    localIdentName: '[path]___[name]__[local]___[hash:base64:5]',
  },
}

const getCssRule = (env, global) => [
  env === 'dev' ? 'style-loader' : MiniCssExtractPlugin.loader,
  getCssLoader(global),
  'postcss-loader',
]

module.exports = env => [
  // { // adds source maps for external modules (like bim)
  //   enforce: 'pre',
  //   test: /\.js$/,
  //   use: 'source-map-loader',
  // },
  {
    test: /\.ts$/,
    use: {
      loader: 'awesome-typescript-loader',
      options: tsOptions(env),
    },
    exclude: /node_modules/,
  },
  { // non-global
    test: /\.pcss$/,
    use: getCssRule(env, false),
    exclude: /node_modules/,
  },
  { // global
    test: /\.css$/,
    use: getCssRule(env, true),
  },
  {
    test: /\.(png|jpg|jpeg|gif|svg)$/,
    use: {
      loader: 'file-loader',
      options: {
        name: '[name].[hash].[ext]',
      },
    },
  },
].filter(i => i)
