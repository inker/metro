const path = require('path')

const optimization = require('./optimization')
const rules = require('./rules')
const plugins = require('./plugins')

const rootDir = process.cwd()
const distDir = path.join(rootDir, 'docs')

module.exports = env => ({
  mode: env === 'dev' ? 'development' : 'production',
  target: 'web',
  entry: {
    app: './src/main.ts',
  },
  output: {
    path: distDir,
    filename: env === 'dev' ? '[name].js' : '[name].[chunkhash].js',
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
      // 'leaflet-dist': path.join(rootDir, 'node_modules/leaflet/dist'),
      // 'alertify-dist': path.join(rootDir, 'node_modules/alertifyjs/build'),
    },
  },
  devtool: env === 'dev' ? 'source-map' : undefined,
  optimization: optimization(env),
  module: {
    rules: rules(env),
  },
  plugins: plugins(env),
  devServer: {
    contentBase: distDir,
    port: 9080,
    compress: env !== 'dev',
    open: true,
  },
})
