e = require('../helper').escape
w = require('../helper').whitespace

# Base class for the syntax tree.
# A node that is silent will swallow it's children output.
#
module.exports = class Node

  # Constructs a syntax node
  #
  # @param [Node] the parent node
  # @param [String] expression the Haml expression to evaluate
  # @param [Number] blockLevel the HTML whitespace block level
  # @param [Number] codeBlockLevel the CoffeeScript block level
  # @param [Boolean] escapeHtml whether to escape the rendered HTML or not
  # @option options [String] format the template format, either `xhtml`, `html4` or `html5`
  #
  constructor: (@parentNode = null, @expression = '', @blockLevel = 0, @codeBlockLevel = 2, @escapeHtml = true, @format = 'html5') ->
    @children = []
    @opener = @closer = ''

    @silent = false

    @cw = w(@codeBlockLevel)
    @hw = w(@blockLevel)

  # Add a child node.
  #
  # @param [Node] child the child node
  #
  addChild: (child) ->
    @children.push child
    @

  # Get the opening tag for the node.
  #
  # @return [String] the opening tag
  #
  getOpener: ->
    @evaluateIfNecessary()
    @opener

  # Get the closing tag for the node.
  #
  # @return [String] the closing tag
  #
  getCloser: ->
    @evaluateIfNecessary()
    @closer

  # Evaluate the node when not already done.
  #
  evaluateIfNecessary: ->
    @evaluate() unless @evaluated
    @evaluated = true

  # Creates the CoffeeScript code that outputs
  # the given static HTML.
  #
  # @param [String] html the html to output
  # @return [String] the CoffeeScript code
  #
  outputHtml: (html) ->
    "#{ @cw }o.push \"#{ @hw }#{ html }\"\n"

  # Adds the CoffeeScript code to the template
  # to be run at render time.
  #
  # @param [String] code the CoffeeScript code
  # @return [String] the CoffeeScript code
  #
  outputCode: (code) ->
    "#{ @cw }#{ code }\n"

  # Creates the CoffeeScript code that runs the
  # given CoffeeScript code at render time and
  # output it as HTML.
  #
  # @param [String] code the code to run and capture output
  # @param [Boolean] escape whether to escape the generated output
  # @return [String] the CoffeeScript code
  #
  outputCodeHtml: (code, escape = false) ->
    if escape
      "#{ @cw }o.push e \"#{ @hw }\#{#{ code }}\"\n"
    else
      "#{ @cw }o.push \"#{ @hw }\#{#{ code }}\"\n"

  # Template method that must be implemented by each
  # Node subclass. This evaluates the `@expression`
  # and save the generated HTML tags as `@opener` and
  # `@closer` if applicable.
  #
  # @abstract
  #
  evaluate: ->

  # Render the node and its children to CoffeeScript code.
  # This base implementation handles normal and self closing tags
  # and does no output escaping. Override this in the specific node
  # implementation if you need special rendering behaviour.
  #
  # @return [String] the code
  #
  render: ->
    output = ''

    # Nodes without children
    if @children.length is 0

      # Non self closing tag
      if @getOpener().length > 0 && @getCloser().length > 0
        output = @outputHtml(@getOpener() + @getCloser())

      # Self closing tag
      else if @getOpener().length > 0
        output = @outputHtml(@getOpener())

    # Nodes with children
    else

      # Non self closing Haml tag
      if @getOpener().length > 0 && @getCloser().length > 0
        output = @outputHtml(@getOpener())

        for child in @children
          output += child.render()

        output += @outputHtml(@getCloser()) if @getCloser().length > 0

      # Text and code node or Haml nodes without content (e.g. the root node)
      # A code node is set to `silent` when it contains a silent comment.
      else
        unless @silent
          for child in @children
            output += child.render()

    output
