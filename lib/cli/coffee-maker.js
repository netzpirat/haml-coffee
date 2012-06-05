(function() {
  var CoffeeMaker, CoffeeScript, HamlCoffee, fs;

  CoffeeScript = require('coffee-script');

  HamlCoffee = require('../haml-coffee');

  fs = require('fs');

  module.exports = CoffeeMaker = (function() {

    function CoffeeMaker() {}

    CoffeeMaker.compileFile = function(filename, compilerOptions, namespace, templateName) {
      var compiler, haml, output, source, _ref;
      if (compilerOptions == null) {
        compilerOptions = {};
      }
      if (namespace == null) {
        namespace = null;
      }
      if (templateName == null) {
        templateName = null;
      }
      output = '';
      try {
        source = fs.readFileSync(filename).toString();
      } catch (error) {
        console.error('  \x33[91mError opening file:\x33[0m %s', error);
        console.error(error);
      }
      try {
        if (!templateName) {
          templateName = (_ref = filename.match(/([^\.]+)(\.html)?\.haml[c]?$/)) != null ? _ref[1] : void 0;
        }
        if (templateName) {
          compiler = new HamlCoffee(compilerOptions);
          compiler.parse(source);
          haml = compiler.render(templateName, namespace);
        } else {
          console.error('  \x33[91m[haml coffee] no valid Haml extension.\x33[0m');
          process.exit(1);
        }
      } catch (error) {
        console.error('  \x33[91m[haml coffee] error compiling Haml file:\x33[0m %s', error);
        console.error(error.stack);
        process.exit(1);
      }
      try {
        output = CoffeeScript.compile(haml);
      } catch (error) {
        console.error('  \x33[91m[haml coffee] CoffeeScript compilation error:\x33[0m %s', error);
        console.error(error.stack);
        process.exit(1);
      }
      return output;
    };

    return CoffeeMaker;

  })();

}).call(this);
