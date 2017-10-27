const cssLoader = require('css-loader')
const loaderUtils = require('loader-utils')

module.exports = function(content) {
  if (this.cacheable) {
    this.cacheable(false)
  }

  

    // console.log(Object.keys(this))

  console.log('resource', this.resource)

  const foo = Object.assign({}, this)

  if (this.resource.endsWith('.css?global')) {
    return cssLoader.call(this, content)
  } else {
    console.log('setting new')
    this.query = {
      modules: true,
      importLoaders: 1,
      localIdentName: '[path]___[name]__[local]___[hash:base64:5]',
    }
    console.log('q', this.query)
    return cssLoader.call(this, content)
  }  

  // console.log('')

  // console.log('resourcePath', this.resourcePath)
  // console.log('context', this.context)
  // console.log('resourceQuery', this.resourceQuery)  
  // console.log('data', this.data)
  // console.log('query', this.query)
  // console.log('request', this.request)
        
  // var query = loaderUtils.getOptions(this)
  // // console.log('qqq', query)
  // const g = query.resourceOptions && query.resourceOptions.global
  // // console.log(query)
  // console.log('global', g)

  
}
