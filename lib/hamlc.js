(function() {
  var CoffeeScript, Compiler;

  Compiler = require('./haml-coffee');

  CoffeeScript = require('coffee-script');

  module.exports = {
    compile: function(source, options) {
      var compiler, template;
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
      compiler = new Compiler(options);
      compiler.parse(source);
      return CoffeeScript.compile(compiler.render(name, namespace));
    }
  };

}).call(this);
