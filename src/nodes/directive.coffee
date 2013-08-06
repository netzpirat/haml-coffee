path = require('path')
Node = require('./node')

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
        when 'global' then "#{ @namespace }['#{ name }'].apply(#{ context })"
        when 'amd' then "require('#{ name }').apply(#{ context })"
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
