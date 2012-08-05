(function() {
  var CoffeeScript, Compiler, fs, __expressCache;

  fs = require('fs');

  Compiler = require('./haml-coffee');

  CoffeeScript = require('coffee-script');

  __expressCache = {};

  module.exports = {
    compile: function(source, options) {
      var compiler, template;
      if (options == null) {
        options = {};
      }
      compiler = new Compiler(options);
      compiler.parse(source);
      template = new Function(CoffeeScript.compile(compiler.precompile(), {
        bare: true
      }));
      return function(params) {
        return template.call(params);
      };
    },
    template: function(source, name, namespace, options) {
      var compiler;
      if (options == null) {
        options = {};
      }
      compiler = new Compiler(options);
      compiler.parse(source);
      return CoffeeScript.compile(compiler.render(name, namespace));
    },
    __express: function(filename, options, callback) {
      var source;
      options.cache = true;
      if (!!(options && options.constructor && options.call && options.apply)) {
        callback = options;
        options = {};
      }
      try {
        if (options.cache && __expressCache[filename]) {
          return callback(null, __expressCache[filename](options));
        } else {
          options.filename = filename;
          source = fs.readFileSync(filename, 'utf8');
          if (options.cache) {
            __expressCache[filename] = module.exports.compile(source, options);
            return callback(null, __expressCache[filename](options));
          } else {
            return callback(null, module.exports.compile(source, options)(options));
          }
        }
      } catch (err) {
        return callback(err);
      }
    }
  };

}).call(this);
