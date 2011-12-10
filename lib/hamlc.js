(function() {
  var CoffeeScript, Compiler;

  Compiler = require('./haml-coffee');

  CoffeeScript = require('coffee-script');

  module.exports = {
    compile: function(source, options) {
      var compiler;
      if (options == null) options = {};
      compiler = new HamlCoffee(options);
      compiler.parse(source);
      return CoffeeScript.eval(compiler.precompile());
    },
    template: function(source, name, namespace, options) {
      var compiler;
      if (options == null) options = {};
      compiler = new HamlCoffee(options);
      compiler.parse(source);
      return CoffeeScript.compile(compiler.render(name, namespace));
    }
  };

}).call(this);
