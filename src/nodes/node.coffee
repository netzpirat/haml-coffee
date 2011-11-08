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
  # @param [Number] block_level the HTML whitespace block level
  # @param [Number] code_block_level the CoffeeScript block level
  # @param [Boolean] escape_html whether to escape the rendered HTML or not
  # @option options [String] format the template format, either `xhtml`, `html4` or `html5`
  #
  constructor: (@parent_node, @expression, @block_level, @code_block_level, @escape_html, @format) ->
    @children = []
    @opener = @closer = ''
    @silent = false
    @cw = w(@code_block_level)
    @hw = w(@block_level)

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

  # Template method that must be implemented by each
  # Node subclass. This evaluates the `@expression`
  # and save the generated HTML tags as `@opener` and
  # `@closer` if applicable.
  #
  # @abstract
  #
  evaluate: ->

  # Render the node and its children
  # to CoffeeScript code.
  #
  # @return [String] the code
  #
  render: ->
    output = ''

    # Nodes without children
    if @children.length is 0

      # Non self closing tag
      if @getOpener().length > 0 && @getCloser().length > 0
        output = "#{ @cw }o.push \"#{ @hw }#{ @getOpener() }#{ @getCloser() }\"\n"

      # Self closing tag
      else if @getOpener().length > 0
        output = "#{ @cw }o.push \"#{ @hw }#{ @getOpener() }\"\n"

    # Nodes with children
    else

      # Non self closing Haml tag
      if @getOpener().length > 0 && @getCloser().length > 0
        output = "#{ @cw }o.push \"#{ @hw }#{ @getOpener() }\"\n"
        output += "#{ child.render() }" for child in @children
        output += "#{ @cw }o.push \"#{ @hw }#{ @getCloser() }\"\n" if @getCloser().length > 0

      # Text and code node or Haml nodes without content (e.g. the root node)
      # A code node is set to `silent` when it contains a silent comment.
      else
        unless @silent
          output += "#{ child.render() }" for child in @children

    output
