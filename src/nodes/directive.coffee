path = require('path')
Node = require('./node')

unless process.browser
  fs = require('fs')
  CoffeeScript = require 'coffee-script'

# Directive node for HAML statements that change the meaning or do interact
# uniquely with the HAML document.
#
# @example include a HAML document inside of another
#   +include 'path/to/template'[, context]
#
module.exports = class Directive extends Node

  # Map of available directives to methods.
  #
  directives:

    # Includes a HAML document inside of the current one. Context included
    # template is defaulted to the context of this template but may be changed
    # by passing a second argument.
    #
    # @example Include with default context
    #   +include 'path/to/template'
    #
    # @example Include with custom context
    #   +include 'path/to/template', @context
    #
    include: (expression) ->
      try [[], name, context] = expression.match(/\s*['"](.*?)['"](?:,\s*(.*))?\s*/)
      catch e
        throw new Error("Failed to parse the include directive from #{ expression }")

      context = 'this' unless context
      statement = switch @placement
        when 'global' then "#{ @namespace }['#{ name }'](#{ context })"
        when 'amd' then "require('#{ name }')(#{ context })"
        when 'standalone'
          if browser?.process
            throw new Error("Include directive not available in the Browser when placement is standalone.")
          else
            # A standalone template cannot depend on another template so
            # we need to compile the referenced template and attach it as a
            # precompiled (standalone) template here.

            # Read the source.
            try
              source = fs.readFileSync(name).toString()
            catch error
              console.error "  Error opening file: %s", error
              console.error error

            # Compile and build the source function.
            Compiler = require '../haml-coffee'
            compiler = new Compiler(@options)
            compiler.parse source
            code = CoffeeScript.compile(compiler.precompile(), bare: true)
            statement = "`(function(){#{code}}).apply(#{context})`"

        else
          throw new Error("Include directive not available when placement is #{ @placement }")

      @opener = @markInsertingCode statement, false

  # Evaluate the Haml directive.
  #
  evaluate: ->
    directives = Object.keys(@directives).join('|')
    try [[], name, rest] = @expression.match(///\+(#{ directives })(.*)///)
    catch e
      throw new Error("Unable to recognize directive from #{ @expression }")

    @directives[name].call this, rest
