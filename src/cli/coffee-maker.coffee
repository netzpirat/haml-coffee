CoffeeScript  = require 'coffee-script'
HamlCoffee    = require '../haml-coffee'
fs            = require 'fs'

red   = '\u001b[31m'
reset = '\u001b[0m'

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
      console.error "  #{ red }Error opening file:#{ reset } %s", error
      console.error error

    try
      # Derive template name from filename by remove .html and .haml
      templateName = filename.match(/([^\.]+)(\.html)?\.haml[c]?$/)?[1] unless templateName

      # Extend the options with the name and namespace so that the
      # compiler has these configuration properties from the beginning
      # and that the API for this method can stay the same.
      compilerOptions.namespace = namespace
      compilerOptions.name = templateName

      if templateName
        compiler = new HamlCoffee compilerOptions
        compiler.parse source

        haml = compiler.render()

      else
        console.error "  #{ red }[haml coffee] no valid Haml extension.#{ reset }"
        process.exit 1

    catch error
      console.error "  #{ red }[haml coffee] error compiling Haml file:#{ reset } %s", error
      console.error error.stack
      process.exit 1

    try
      output = CoffeeScript.compile haml

    catch error
      console.error '  #{ red }[haml coffee] CoffeeScript compilation error:#{ reset } %s', error
      console.error error.stack
      process.exit 1

    output

  # Compiles a Haml-Coffee file to a JavaScript template.
  # When the output template is omitted, it will be derived from the file name.
  #
  # @param [String] source the template source code
  # @param [String] templateName the name of the output template
  # @param [String] namespace the template namespace
  # @param [Object] compilerOptions the compiler options
  #
  @compile = (source, templateName, namespace = null, compilerOptions = {}) ->
    output = ''

    # Extend the options with the name and namespace so that the
    # compiler has these configuration properties from the beginning
    # and that the API for this method can stay the same.
    compilerOptions.namespace = namespace
    compilerOptions.name = templateName

    try
      if templateName || compilerOptions.placement is 'amd'
        compiler = new HamlCoffee compilerOptions
        compiler.parse source
        haml = compiler.render templateName, namespace

      else
        console.error "  #{ red }[haml coffee] no template name given.#{ reset }"
        process.exit 1

    catch error
      console.error "  #{ red }[haml coffee] error compiling Haml file:#{ reset } %s", error
      console.error error.stack
      process.exit 1

    try
      output = CoffeeScript.compile haml

    catch error
      console.error '  #{ red }[haml coffee] CoffeeScript compilation error:#{ reset } %s', error
      console.error error.stack
      process.exit 1

    output

  @renderFile = (filename, compilerOptions = {}) ->
    fn = @compileFile filename, compilerOptions
    eval(fn)()

  @render = (source, compilerOptions = {}) ->
    fn = @compile source, 'test', null, compilerOptions
    eval(fn)()
