Compiler     = require('./haml-coffee')
CoffeeScript = require('coffee-script')

# Facade to Haml Coffee for easy template function
# compiling and JST template rendering.
#
module.exports =

  # Compile the Haml Coffee template into
  # a JavaScript function.
  #
  # @see {Compiler} for a complete list of the supported
  #      compiler options.
  #
  # @param [String] source the Haml Coffee source
  # @param [Object] options the compiler options
  # @return [Function] the template
  #
  compile: (source, options) ->
    compiler = new Compiler(options)
    compiler.parse source

    template = new Function CoffeeScript.compile(compiler.precompile(), bare: true)

    (params) -> template.call params

  # Render a JavaScript Template.
  #
  # @see {Compiler} for a complete list of the supported
  #      compiler options.
  #
  # @param [String] source the Haml Coffee source
  # @param [Object] options the compiler options
  # @return [String] the template source code
  #
  template: (source, name, namespace, options) ->
    compiler = new Compiler(options)
    compiler.parse source

    CoffeeScript.compile compiler.render(name, namespace)
