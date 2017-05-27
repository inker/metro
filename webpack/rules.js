const { sep } = require('path')

const isGlobal = `src\\${sep}css|node_modules`
const cssExt = '\\.css$'
const IS_GLOBAL = new RegExp(isGlobal)
const IS_CSS = new RegExp(cssExt)
const IS_GLOBAL_CSS = new RegExp(`(${isGlobal}).+?${cssExt}`)

const tsDev = 'awesome-typescript-loader'

const tsProd = {
  loader: tsDev,
  options: {
    ignoreDiagnostics: [2403, 2300, 2451, 2307, 2345, 2339, 2305], // 2305 is temporary
  },
}

module.exports = env => [
  // { // adds source maps for external modules (like bim)
  //   enforce: 'pre',
  //   test: /\.js$/,
  //   use: 'source-map-loader',
  // },
  {
    test: /\.ts$/,
    use: env === 'dev' ? tsDev : tsProd,
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
]
