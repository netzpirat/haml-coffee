CoffeeScript  = require('coffee-script')
HamlCoffee    = require('../haml-coffee')
fs            = require('fs')

module.exports = class CoffeeMaker

  # Compiles a Haml-Coffee file to a JavaScript template.
  # When the output template is omitted, it will be derived from the file name.
  #
  # @param [String] filename the Haml coffee file to compile
  # @param [Object] compilerOptions the compiler options
  # @param [String] namespace the template namespace
  # @param [String] templateName the name of the output template
  #
  @compileFile = (filename, compilerOptions = {}, namespace = null, templateName = null) ->
    output = ''

    try
      source = fs.readFileSync(filename).toString()
    catch error
      console.error '  \x33[91mError opening file:\x33[0m %s', error
      console.error error

    try
      # Derive template name from filename by remove .html and .haml
      templateName = filename.match(/([^\.]+)(\.html)?\.haml[c]?$/)?[1] unless templateName

      if templateName
        compiler = new HamlCoffee compilerOptions
        compiler.parse source
        haml = compiler.render templateName, namespace

      else
        console.error '  \x33[91m[haml coffee] no valid Haml extension.\x33[0m'
        process.exit 1

    catch error
      console.error '  \x33[91m[haml coffee] error compiling Haml file:\x33[0m %s', error
      console.error error.stack
      process.exit 1

    try
      output = CoffeeScript.compile haml

    catch error
      console.error '  \x33[91m[haml coffee] CoffeeScript compilation error:\x33[0m %s', error
      console.error error.stack
      process.exit 1

    output
