const {
  optimize: {
    UglifyJsPlugin,
    CommonsChunkPlugin,
  },
  ProvidePlugin,
} = require('webpack')

// const { CheckerPlugin } = require('awesome-typescript-loader')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const WebpackBrowserPlugin = require('webpack-browser-plugin')

const path = require('path')

const isGlobal = `src\\${path.sep}css|node_modules`
const cssExt = '\\.css$'
const IS_GLOBAL = new RegExp(isGlobal)
const IS_CSS = new RegExp(cssExt)
const IS_GLOBAL_CSS = new RegExp(`(${isGlobal}).+?${cssExt}`)

module.exports = {
  target: 'web',
  context: path.join(__dirname, 'src'),
  entry: {
    app: './main.ts',
  },
  output: {
    path: path.join(__dirname, 'docs'),
    filename: '[name].js',
    sourceMapFilename: '[file].map',
  },
  resolve: {
    extensions: [
      '.ts',
      '.tsx',
      '.js',
      '.jsx',
    ],
    alias: {
      'leaflet-dist': path.join(__dirname, 'node_modules/leaflet/dist'),
      'alertify-dist': path.join(__dirname, 'node_modules/alertifyjs/build'),
    },
  },
  devtool: 'source-map', // enables sourcemaps
  module: {
    rules: [
      { // adds source maps for external modules (like bim)
        enforce: 'pre',
        test: /\.js$/,
        use: 'source-map-loader',
      },
      {
        test: /\.ts$/,
        use: 'awesome-typescript-loader',
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
    ],
  },
  plugins: [
    // new CheckerPlugin(),
    new CommonsChunkPlugin({
      name: 'vendor',
      filename: 'vendor.js',
      minChunks: module => module.context && module.context.includes('node_modules'),
    }),
    new ProvidePlugin({
      Promise: 'es6-promise',
      fetch: 'imports-loader?this=>global!exports-loader?global.fetch!whatwg-fetch',
    }),
    new UglifyJsPlugin({
      compress: {
        screw_ie8: true,
        warnings: false,
        drop_debugger: false,
        dead_code: true,
        properties: true,
        unused: true,
        join_vars: true,
      },
      output: {
        comments: false,
      },
      sourceMap: true, // retains sourcemaps for typescript
    }),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'template.html',
      hash: true,
      minify: {
        minifyJS: true,
        minifyCSS: true,
        removeComments: true,
        collapseWhitespace: true,
      },
    }),
    new CopyWebpackPlugin([
      {
        from: '../res',
        to: 'res',
      },
    ]),
    new WebpackBrowserPlugin({
      url: 'http://localhost',
      port: 9080,
    }),
  ],
}
