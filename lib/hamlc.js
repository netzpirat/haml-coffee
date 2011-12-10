(function() {
  var CoffeeScript, Compiler;
  var __slice = Array.prototype.slice;

  Compiler = require('./compiler');

  CoffeeScript = require('coffee-script');

  module.exports = {
    compile: function(source, options) {
      var compiler;
      if (options == null) options = {};
      compiler = new Compiler(options);
      compiler.parse(source);
      return function() {
        var args, _ref;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return (_ref = compiler.compile()).call.apply(_ref, args);
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
