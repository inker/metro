module.exports = {
  extends: [
    '@inker/eslint-config-typescript',
    // 'plugin:import/errors',
    // 'plugin:import/warnings',
  ],

  plugins: [
    // 'import',
    '@typescript-eslint',
  ],

  parser: '@typescript-eslint/parser',

  settings: {
    // Append 'ts' extensions to Airbnb 'import/resolver' setting
    'import/resolver': {
      // use <root>/tsconfig.json
      typescript: {
        // always try to resolve types under `<roo/>@types` directory
        // even if it doesn't contain any source code, like `@types/unist`
        alwaysTryTypes: true,
      },
      node: {
        extensions: [
          '.mjs',
          '.js',
          '.jsx',
          '.ts',
          '.tsx',
          '.json',
        ],
        webpack: {
          config: 'webpack/webpack.config.js',
        },
      },
    },
    // Append 'ts' extensions to Airbnb 'import/extensions' setting
    'import/extensions': [
      '.js',
      '.jsx',
      '.ts',
      '.tsx',
      '.mjs',
    ],
  },

  rules: {
    'object-property-newline': [2, {
      allowAllPropertiesOnSameLine: false,
    }],

    '@typescript-eslint/no-unused-vars': [2, {
      vars: 'all',
      args: 'after-used',
      ignoreRestSiblings: false,
    }],
  },

  globals: {
    __DEV__: true,
    __SSR__: true,
  },
}
