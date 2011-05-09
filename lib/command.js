(function() {
  var CoffeeMaker, fs, glob;
  CoffeeMaker = require('./coffee_maker');
  fs = require('fs');
  glob = require('glob');
  exports.run = function() {
    var compiled_output, input_filename, output_filename;
    if (process.argv.length < 3) {
      console.log("Usage: haml-coffee INPUT [OUTPUT]\n");
      console.log("  INPUT may be a file or directory, in a directory all *.haml files will be processed");
      console.log("  OUTPUT is an optional argument, the default output file is 'compiled-haml.js'");
    } else {
      input_filename = process.argv[2];
      output_filename = process.argv[3] || "compiled-haml.js";
      compiled_output = "";
      fs.stat(input_filename, function(err, stat) {
        var base_dir;
        if (!err) {
          if (!stat.isDirectory()) {
            console.log('  \033[90m[haml coffee] compiling file\033[0m %s', input_filename);
            compiled_output = CoffeeMaker.compileFile(input_filename, compiled_output);
            fs.writeFileSync(output_filename, compiled_output);
            process.exit(0);
          } else {
            console.log('  \033[92m[haml coffee] compiling directory\033[0m %s', input_filename);
            base_dir = input_filename.replace(/\/$/, "");
            process.chdir(base_dir);
            glob.glob("**/*.haml", "", function(err, matches) {
              var filename, match, _i, _len;
              if (!err) {
                for (_i = 0, _len = matches.length; _i < _len; _i++) {
                  match = matches[_i];
                  console.log('    \033[90m[haml coffee] compiling file\033[0m %s', match);
                  filename = "" + match;
                  compiled_output = CoffeeMaker.compileFile(filename, compiled_output);
                }
                fs.writeFileSync(output_filename, compiled_output);
                process.exit(0);
              }
              return;
            });
          }
        } else {
          console.log('  \033[91m[haml coffee] error compiling file\033[0m %s', process.argv[2]);
          process.exit(1);
        }
        return;
      });
    }
    return;
  };
}).call(this);
