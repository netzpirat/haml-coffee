CoffeeScript  = require('coffee-script')
HamlCoffee    = require('../haml-coffee')
fs            = require('fs')

module.exports = class CoffeeMaker

  # Compiles a Haml coffee file to a JavaScript template
  # When the output template is omitted, it will be derived from the file name.
  #
  # @param [String] filename the Haml coffee file to compile
  # @param [Object] compilerOptions the compiler options
  # @param [String] namespace the template namespace.
  # @param [String] templateName the name of the output template.
  #
  @compileFile = (filename, compilerOptions = {}, namespace = null, templateName = null) ->
    output = ''

    try
      source = fs.readFileSync(filename).toString()
    catch error
      console.log '  \033[91mError opening file:\033[0m %s', error
      console.log error

    try
      # Derive template name from filename by remove .html and .haml
      templateName = filename.match(/([^\.]+)(\.html)?\.haml[c]?$/)?[1] unless templateName

      if templateName
        compiler = new HamlCoffee compilerOptions
        compiler.parse source
        haml = compiler.render templateName, namespace

      else
        console.log '  \033[91m[haml coffee] no valid Haml extension.\033[0m'
        process.exit 1

    catch error
      console.log '  \033[91m[haml coffee] error compiling Haml file:\033[0m %s', error
      console.log error.stack
      process.exit 1

    try
      output = CoffeeScript.compile haml

    catch error
      console.log '  \033[91m[haml coffee] CoffeeScript compilation error:\033[0m %s', error
      console.log error.stack
      process.exit 1

    output
