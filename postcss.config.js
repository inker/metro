const cssnext = require('postcss-cssnext')
const cssnano = require('cssnano')

module.exports = {
  plugins: [
    cssnext({}),
    cssnano({
      zindex: false,
    }),
  ],
}
