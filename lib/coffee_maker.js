(function() {
  var CoffeeMaker, CoffeeScript, Compiler, fs;
  CoffeeScript = require('coffee-script');
  Compiler = require('./compiler');
  fs = require('fs');
  module.exports = CoffeeMaker = (function() {
    function CoffeeMaker() {}
    CoffeeMaker.compileFile = function(filename, compiledOutput, templateName, compilerOptions) {
      var compiler, name, renderedHaml, source, strippedFilename;
      if (compiledOutput == null) {
        compiledOutput = "";
      }
      if (templateName == null) {
        templateName = null;
      }
      if (compilerOptions == null) {
        compilerOptions = {};
      }
      try {
        source = fs.readFileSync(filename).toString();
      } catch (error) {
        console.log(error);
      }
      try {
        strippedFilename = filename.match(/([^\.]+)(\.html)?\.haml$/);
        if (strippedFilename != null) {
          name = templateName || strippedFilename[1];
          compiler = new Compiler(compilerOptions);
          compiler.parse(source);
          renderedHaml = compiler.render(name);
        } else {
          console.log('  \033[91m[haml coffee] no valid haml extension\033[0m');
          process.exit(1);
        }
      } catch (error) {
        console.log('  \033[91m[haml coffee] error compiling file\033[0m %s', error);
        console.log(error.stack);
        process.exit(1);
      }
      try {
        compiledOutput += CoffeeScript.compile(renderedHaml);
      } catch (error) {
        console.log("CoffeeScript " + error);
        console.log(error.stack);
      }
      return compiledOutput;
    };
    return CoffeeMaker;
  })();
}).call(this);
