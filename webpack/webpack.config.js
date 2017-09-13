const path = require('path')
const rules = require('./rules')
const plugins = require('./plugins')

const rootDir = process.cwd()
const distDir = path.join(rootDir, 'docs')

module.exports = env => ({
  target: 'web',
  entry: {
    app: './src/main.ts',
  },
  output: {
    path: distDir,
    filename: env === 'dev' ? '[name].js' : '[name].[hash].js',
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
      'leaflet-dist': path.join(rootDir, 'node_modules/leaflet/dist'),
      'alertify-dist': path.join(rootDir, 'node_modules/alertifyjs/build'),
    },
  },
  devtool: env === 'dev' ? 'source-map' : undefined,
  module: {
    rules: rules(env),
  },
  plugins: plugins(env),
  devServer: env !== 'dev' ? undefined : {
    contentBase: distDir,
    port: 9080,
  },
})
