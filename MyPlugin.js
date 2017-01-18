// MyPlugin.js

const fs = require('fs')

function censor(censor) {
  var i = 0;

  return function(key, value) {
    if(i !== 0 && typeof(censor) === 'object' && typeof(value) == 'object' && censor == value) 
      return '[Circular]'; 

    if(i >= 29) // seems to be a harded maximum of 30 serialized objects?
      return '[Unknown]';

    ++i; // so we know we aren't using the original object anymore

    return value;  
  }
}

function MyPlugin(options) {
    console.log('options', options)
  // Configure your plugin with options...
}

MyPlugin.prototype.apply = function(compiler) {
    compiler.plugin("compile", function(params) {
        // console.log("The compiler is starting to compile...", params);
        // console.log('ruleset', params.normalModuleFactory.ruleSet)
        for (const rule of params.normalModuleFactory.ruleSet.rules) {
            // console.log(rule)
        }
        // fs.writeFile('./qux.json', JSON.stringify(params, null, 2), err => {
        //     if (err) {
        //         throw err
        //     }
        // })
    });

    compiler.plugin('this-compilation', (compilation, foobar) => {
        // console.log('holy crap 1', foobar)
        compilation.plugin('additional-assets', (barfoo) => {
            setTimeout(() => {
                for (let i = 0; i < compilation.fileDependencies.length; ++i) {
                    compilation.fileDependencies[i] = compilation.fileDependencies[i].replace(/\\/g, '/')
                }
                console.log('holy crap 2', compilation.fileDependencies)
                return barfoo()
            }, 30000)
            // console.log('barfoo', barfoo)
        })
    })

//   compiler.plugin("compilation", function(compilation) {
//     console.log("The compiler is starting a new compilation...");

//     fs.writeFile('./foo.json', JSON.stringify(compilation, null, 2), err => {
//         if (err) {
//             throw err
//         }
//     })

//     // compilation.plugin("optimize", function() {
//     //   console.log("The compilation is starting to optimize files...");
//     // });
//   });

  compiler.plugin("emit", function(compilation, callback) {
    console.log('emitting')
    console.log('holy crap 3', compilation.fileDependencies)
            for (let i = 0; i < compilation.fileDependencies.length; ++i) {
                compilation.fileDependencies[i] = compilation.fileDependencies[i].replace(/\\/g, '/')
            }
    fs.writeFile('./bar.json', JSON.stringify(compilation.fileDependencies, censor(compilation), 2), err => {
        if (err) {
            throw err
        }
    })
    console.log("The compilation is going to emit files...");
    callback();
  });
};

module.exports = MyPlugin;