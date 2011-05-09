CoffeeMaker   = require('./coffee_maker')
fs            = require('fs')
glob          = require('glob')

# run function which is exposed to the module
exports.run = ->
  # check for enough arguments
  if process.argv.length < 3
    console.log("Usage: haml-coffee INPUT [OUTPUT]\n")
    console.log("  INPUT may be a file or directory, in a directory all *.haml files will be processed")
    console.log("  OUTPUT is an optional argument, the default output file is 'compiled-haml.js'")
  else
    input_filename = process.argv[2]
    output_filename = process.argv[3] || "compiled-haml.js"
    compiled_output = ""
    
    fs.stat input_filename, (err, stat) ->
      unless err
        unless stat.isDirectory()
          console.log('  \033[90m[haml coffee] compiling file\033[0m %s', input_filename);
          compiled_output = CoffeeMaker.compileFile(input_filename, compiled_output)
          
          # output the file
          fs.writeFileSync(output_filename, compiled_output)
          
          # we exit with everthing cool exit code ;-)
          process.exit(0);
        else
          console.log('  \033[92m[haml coffee] compiling directory\033[0m %s', input_filename);
          # removing a trailing slash
          base_dir = input_filename.replace(/\/$/, "")
          process.chdir(base_dir)
          glob.glob "**/*.haml", "", (err, matches) ->
            unless err
              # process all matches
              for match in matches
                console.log('    \033[90m[haml coffee] compiling file\033[0m %s', match);
                filename = "#{match}"
                compiled_output = CoffeeMaker.compileFile(filename, compiled_output)                

              # output the file
              fs.writeFileSync(output_filename, compiled_output)

              # we exit with everthing cool exit code ;-)
              process.exit(0);
            return
      else
        console.log('  \033[91m[haml coffee] error compiling file\033[0m %s', process.argv[2]);
        
        # uhh something really bad happened
        process.exit(1);
      return
  return