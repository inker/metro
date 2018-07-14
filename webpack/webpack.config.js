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
    modules: [
      path.resolve(rootDir, 'src'),
      'node_modules',
    ],
    // alias: env === 'dev' ? undefined : {
    //   'react': path.join(rootDir, 'node_modules/react/dist/react.min.js'),
    //   'react-dom': path.join(rootDir, 'node_modules/react-dom/dist/react-dom.min.js'),
    // },
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
    historyApiFallback: {
      rewrites: [
        {
          from: /./,
          to: '/404.html',
        },
      ],
    },
    open: true,
  },
})
