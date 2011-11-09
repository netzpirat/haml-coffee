CoffeeScript  = require('coffee-script')
Compiler      = require('./compiler')
fs            = require('fs')

module.exports = class CoffeeMaker

  # Compiles a Haml coffee file to a JavaScript template
  # When the output template is omitted, it will be derived from the file name.
  #
  # @param [String] filename the Haml coffee file to compile
  # @param [String] compiledOutput the output where the JavaScript template is appended
  # @param [String] templateName the name of the output template.
  # @param [Object] compilerOptions the compiler options
  #
  @compileFile = (filename, compiledOutput = "", templateName = null, compilerOptions = {}) ->

    try
      source = fs.readFileSync(filename).toString()
    catch error
      console.log error

    try
      # strip optional .html and .haml from filename
      strippedFilename = filename.match /([^\.]+)(\.html)?\.haml$/

      if strippedFilename?
        name = templateName || strippedFilename[1]
        compiler = new Compiler compilerOptions
        compiler.parse source
        renderedHaml = compiler.render name

      else
        console.log '  \033[91m[haml coffee] no valid haml extension\033[0m'
        process.exit 1

    catch error
      console.log '  \033[91m[haml coffee] error compiling file\033[0m %s', error
      console.log error.stack
      process.exit 1

    try
      compiledOutput += CoffeeScript.compile renderedHaml

    catch error
      console.log "CoffeeScript " + error
      console.log error.stack

    compiledOutput
