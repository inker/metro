const {
  optimize: {
    UglifyJsPlugin,
    CommonsChunkPlugin,
  },
  ProvidePlugin,
} = require('webpack')

const { CheckerPlugin } = require('awesome-typescript-loader')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const WebpackBrowserPlugin = require('webpack-browser-plugin')

const isModuleCSS = path => /\.css$/.test(path) && !/src\/css|node_modules/.test(path)

module.exports = {
  target: 'web',
  context: `${__dirname}/src`,
  entry: {
    vendor: [
      'leaflet',
      'alertifyjs',
      'hammerjs',
      'lodash',
      'bim',
      'leaflet-dist',
      'alertify-dist',
    ],
    app: './main.ts',
  },
  output: {
    path: `${__dirname}/public`,
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
      'leaflet-dist': `${__dirname}/node_modules/leaflet/dist`,
      'alertify-dist': `${__dirname}/node_modules/alertifyjs/build`,
    }
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.js$/,
        loader: 'source-map-loader',
      },
      {
        test: isModuleCSS,
        loaders: [
          'style-loader',
          'css-loader?modules=true&importLoaders=1&localIdentName=[path]___[name]__[local]___[hash:base64:5]',
          // 'postcss-loader',
        ],
      },
      {
        test: /(src\/css|node_modules).+?\.css$/,
        loaders: [
          'style-loader',
          'css-loader',
        ],
      },
      {
        test: /\.(png|jpg|jpeg|gif)$/,
        use: {
          loader: 'url-loader',
          options: {
            limit: 10000,
          }
        }
      },
      {
        test: /\.ts$/,
        loader: 'awesome-typescript-loader',
      },
    ],
  },
  plugins: [
    // new CheckerPlugin(),
    new CommonsChunkPlugin({
      name: "vendor",
      filename: "vendor.js",
      minChunks: Infinity,
    }),
    new ProvidePlugin({
      'Promise': 'es6-promise',
      'fetch': 'imports-loader?this=>global!exports-loader?global.fetch!whatwg-fetch',
    }),
    new UglifyJsPlugin({
      compress: {
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
      sourceMap: true,
    }),
    new HtmlWebpackPlugin({
      filename: '../index.html',
      template: 'template.html',
      hash: true,
      minify: {
        minifyJS: true,
        minifyCSS: true,
        removeComments: true,
        collapseWhitespace: true,
      }
    }),
    new WebpackBrowserPlugin({
      url: 'http://localhost',
      port: 9080,
    }),
  ],
}
