const { sep } = require('path')

const isGlobal = `src\\${sep}css|node_modules`
const cssExt = '\\.css$'
const IS_GLOBAL = new RegExp(isGlobal)
const IS_CSS = new RegExp(cssExt)
const IS_GLOBAL_CSS = new RegExp(`(${isGlobal}).+?${cssExt}`)

const tsOptions = env => env === 'dev' ? {
  // getCustomTransformers: () => ({ before: [styledComponentsTransformer] }),
} : {
  ignoreDiagnostics: [2307, 2345, 2339],
}

module.exports = env => [
  // { // adds source maps for external modules (like bim)
  //   enforce: 'pre',
  //   test: /\.js$/,
  //   use: 'source-map-loader',
  // },
  env !== 'dev' && {
    test: /\.tsx?$/,
    loader: 'lodash-ts-imports-loader',
    exclude: /node_modules/,
    enforce: 'pre',
  },
  {
    test: /\.ts$/,
    use: {
      loader: 'awesome-typescript-loader',
      options: tsOptions(env),
    },
    exclude: /node_modules/,
  },
  { // non-global
    test: path => IS_CSS.test(path) && !IS_GLOBAL.test(path),
    use: [
      'style-loader',
      {
        loader: 'css-loader',
        options: {
          modules: true,
          importLoaders: 1,
          localIdentName: '[path]___[name]__[local]___[hash:base64:5]',
        },
      },
      'postcss-loader',
    ],
  },
  { // global
    test: IS_GLOBAL_CSS,
    use: [
      'style-loader',
      'css-loader',
      'postcss-loader',
    ],
  },
  {
    test: /\.(png|jpg|jpeg|gif)$/,
    use: {
      loader: 'url-loader',
      options: {
        limit: 10000,
      },
    },
  },
].filter(i => i)
