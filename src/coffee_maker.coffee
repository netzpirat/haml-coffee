CoffeeScript  = require('coffee-script')
Compiler      = require('./compiler')
fs            = require('fs')

module.exports = class CoffeeMaker
  # compiles one file
  @compileFile = (filename, compiled_output = "", compiler_options = {}) ->
    try
      source = fs.readFileSync(filename).toString()
    catch cant_read_file_error
      console.log cant_read_file_error

    try
      # strip optional .html and .haml from filename
      stripped_filename = filename.match /([^\.]+)(\.html)?\.haml$/
      if stripped_filename?
        name = stripped_filename[1]
        compiler = new Compiler compiler_options
        compiler.parse source
        rendered_haml = compiler.render name
      else
        console.log '  \033[91m[haml coffee] no valid haml extension\033[0m'
        process.exit 1
    catch haml_error
      console.log '  \033[91m[haml coffee] error compiling file\033[0m %s', haml_error
      process.exit 1

    try
      compiled_output += CoffeeScript.compile rendered_haml
    catch coffee_error
      console.log "CoffeeScript " + coffee_error

    return compiled_output