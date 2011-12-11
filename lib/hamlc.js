(function() {
  var CoffeeScript, Compiler;

  Compiler = require('./haml-coffee');

  CoffeeScript = require('coffee-script');

  module.exports = {
    compile: function(source, options) {
      var compiler;
      if (options == null) options = {};
      compiler = new Compiler(options);
      compiler.parse(source);
      return function(params) {
        return CoffeeScript.eval(compiler.precompile()).call(params);
      };
    },
    template: function(source, name, namespace, options) {
      var compiler;
      if (options == null) options = {};
      compiler = new Compiler(options);
      compiler.parse(source);
      return CoffeeScript.compile(compiler.render(name, namespace));
    }
  };

}).call(this);
