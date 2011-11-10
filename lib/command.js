(function() {
  var CoffeeMaker, argv, fs, glob;
  CoffeeMaker = require('./coffee_maker');
  fs = require('fs');
  glob = require('glob');
  argv = require('optimist').usage('Usage: $0').options('i', {
    alias: 'input',
    demand: true,
    describe: 'Either a file or a directory name to be compiled'
  }).options('o', {
    alias: 'output',
    describe: 'Set the output filename'
  }).options('n', {
    alias: 'namespace',
    describe: 'Set a custom template namespace',
    "default": 'window.HAML'
  }).options('t', {
    alias: 'template',
    describe: 'Set a custom template name'
  }).options('disable-html-escaping', {
    boolean: true,
    describe: 'Disable any HTML output escaping'
  }).options('e', {
    alias: 'custom-html-escape',
    "default": '',
    describe: 'Set the custom HTML escaping function name'
  }).options('f', {
    alias: 'format',
    "default": 'html5',
    describe: 'Set HTML output format, either `xhtml`, `html4` or `html5`'
  }).argv;
  exports.run = function() {
    var compilerOptions, inputFilename, namespace, templateName;
    if (['xhtml', 'html4', 'html5'].indexOf(arv.f) !== -1) {
      throw "Unknown template format '" + arv.f + "'";
    }
    inputFilename = argv.i;
    templateName = argv.t;
    namespace = argv.n;
    compilerOptions = {
      escapeHtml: !argv['disable-html-escaping'],
      customHtmlEscape: argv.e,
      format: arv.f
    };
    return fs.stat(inputFilename, function(err, stat) {
      var baseDir, compound, cwd, outputFilename, _ref;
      if (!err) {
        if (!stat.isDirectory()) {
          console.log('  \033[90m[Haml Coffee] Compiling file\033[0m %s', inputFilename);
          outputFilename = argv.o || ("" + ((_ref = argv.i.match(/([^\.]+)(\.html)?\.haml[c]?$/)) != null ? _ref[1] : void 0) + ".jst");
          fs.writeFileSync(outputFilename, CoffeeMaker.compileFile(inputFilename, compilerOptions, templateName));
          return process.exit(0);
        } else {
          if (templateName) {
            console.log('  \033[91m[Haml Coffee] You can\'t compile all Haml templates in a directory and give a single template name!\033[0m');
            process.exit(1);
          }
          console.log('  \033[92m[Haml Coffee] Compiling directory\033[0m %s', inputFilename);
          baseDir = inputFilename.replace(/\/$/, "");
          cwd = process.cwd();
          compound = '';
          process.chdir(baseDir);
          return glob.glob('**/*.haml[c]', '', function(err, files) {
            var filename, _i, _len, _ref2;
            if (!err) {
              for (_i = 0, _len = files.length; _i < _len; _i++) {
                filename = files[_i];
                console.log('    \033[90m[Haml Coffee] Compiling file\033[0m %s', filename);
                if (argv.o) {
                  compound += CoffeeMaker.compileFile(filename, compilerOptions);
                } else {
                  outputFilename = "" + ((_ref2 = filename.match(/([^\.]+)(\.html)?\.haml[c]?$/)) != null ? _ref2[1] : void 0) + ".jst";
                  fs.writeFileSync(outputFilename, CoffeeMaker.compileFile(filename, compilerOptions));
                }
              }
              if (argv.o) {
                fs.writeFileSync(argv.o, compound);
              }
              process.chdir(cwd);
              return process.exit(0);
            }
          });
        }
      } else {
        console.log('  \033[91m[Haml Coffee] Error compiling file\033[0m %s', process.argv[2]);
        return process.exit(1);
      }
    });
  };
}).call(this);
