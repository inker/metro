// const path = require('path')

const webpack = require('webpack')

const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

const { compact } = require('lodash')

// const SEP_RE = new RegExp(`\\${path.sep}`, 'g')
// const PAGES_RE = /pages[\/\\](.+?)(index)?\.[jt]sx?/

// const moduleToFileNames = (module) => {
//   if (!module.request || !module.optional) {
//     return null
//   }
//   const relativePath = path.relative(module.context, module.request)
//   const tokens = relativePath.match(PAGES_RE)
//   return tokens && tokens[1].replace(SEP_RE, '.').slice(0, -1)
// }

// const chunkToName = (chunk) =>
//   chunk.name
//   || Array.from(chunk.modulesIterable, moduleToFileNames).find((name) => name)
//   || null

module.exports = (isDev) => compact([
  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify(isDev ? 'development' : 'production'),
    },
    __VERSION__: JSON.stringify(new Date().toUTCString()),
  }),

  isDev && new webpack.HotModuleReplacementPlugin(),

  // new webpack.NamedChunksPlugin(chunkToName),

  // new (env === 'dev' ? NamedModulesPlugin : HashedModuleIdsPlugin)(),

  new HtmlWebpackPlugin({
    filename: 'index.html',
    template: 'src/template.html',
    minify: {
      removeComments: true,
      collapseWhitespace: true,
      removeRedundantAttributes: true,
      useShortDoctype: true,
      removeEmptyAttributes: true,
      removeStyleLinkTypeAttributes: true,
      keepClosingSlash: true,
      minifyJS: true,
      minifyCSS: true,
      minifyURLs: true,
    },
  }),

  !isDev && new MiniCssExtractPlugin({
    chunkFilename: '[id].[contenthash].css',
  }),

  new CopyWebpackPlugin({
    patterns: [
      {
        from: 'res',
        to: 'res',
      },
    ],
  }),

  process.env.npm_config_report && new BundleAnalyzerPlugin(),
])
