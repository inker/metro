const {
  DefinePlugin,
  optimize: {
    CommonsChunkPlugin,
    OccurrenceOrderPlugin,
  },
	NamedModulesPlugin,
	HashedModuleIdsPlugin,
} = require('webpack')

const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

// const { CheckerPlugin } = require('awesome-typescript-loader')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

module.exports = env => [
  // new CheckerPlugin(),

  // new OccurrenceOrderPlugin(),

  new DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify(env === 'dev' ? 'development' : 'production'),
    },
  }),

	// new (env === 'dev' ? NamedModulesPlugin : HashedModuleIdsPlugin)(),

	env !== 'dev' && new CommonsChunkPlugin({
		name: 'app',
		children: true,
		minChunks: 2,
		async: 'commons',
	}),

	env !== 'dev' && new CommonsChunkPlugin({
		name: 'vendor',
		// names: 'vendor',
		// chunks: 'app',
		minChunks: ({ context }) => context && context.includes('node_modules'),
	}),

	// env !== 'dev' && new CommonsChunkPlugin({
	// 	name: 'runtime',
	// 	minChunks: Infinity,
	// }),

  new HtmlWebpackPlugin({
    filename: 'index.html',
    template: 'src/template.html',
    hash: true, // needed because of configs
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

  new CopyWebpackPlugin([
    {
      from: 'res',
      to: 'res',
    },
  ]),

  env !== 'dev' && new UglifyJsPlugin({
    uglifyOptions: {
      compress: {
        ecma: 6,
        warnings: true,
        dead_code: true,
        properties: true,
        unused: true,
        join_vars: true,
        drop_console: true,
      },
      mangle: {
        safari10: true,
      },
      output: {
        comments: false,
      },
    },
    // sourceMap: true, // retains sourcemaps for typescript
  }),

  env === 'analyze' && new BundleAnalyzerPlugin(),
].filter(item => item)
