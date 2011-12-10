(function() {
  var CoffeeMaker, CoffeeScript, HamlCoffee, fs;

  CoffeeScript = require('coffee-script');

  HamlCoffee = require('../haml-coffee');

  fs = require('fs');

  module.exports = CoffeeMaker = (function() {

    function CoffeeMaker() {}

    CoffeeMaker.compileFile = function(filename, compilerOptions, namespace, templateName) {
      var compiler, haml, output, source, _ref;
      if (compilerOptions == null) compilerOptions = {};
      if (namespace == null) namespace = null;
      if (templateName == null) templateName = null;
      output = '';
      try {
        source = fs.readFileSync(filename).toString();
      } catch (error) {
        console.log('  \033[91mError opening file:\033[0m %s', error);
        console.log(error);
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
          console.log('  \033[91m[haml coffee] no valid Haml extension.\033[0m');
          process.exit(1);
        }
      } catch (error) {
        console.log('  \033[91m[haml coffee] error compiling Haml file:\033[0m %s', error);
        console.log(error.stack);
        process.exit(1);
      }
      try {
        output = CoffeeScript.compile(haml);
      } catch (error) {
        console.log('  \033[91m[haml coffee] CoffeeScript compilation error:\033[0m %s', error);
        console.log(error.stack);
        process.exit(1);
      }
      return output;
    };

    return CoffeeMaker;

  })();

}).call(this);
