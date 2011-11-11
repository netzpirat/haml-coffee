e = require('../helper').escapeHTML

# Base class for the syntax tree.
#
# This will provide some methods that subclasses must use in order to generate
# some output:
#
# * markText
# * markRunningCode
# * markInsertingCode
#
# Each node must mark the `@opener` attribute and can optionally mark the `@closer`
# attribute.
#
module.exports = class Node

  # Hidden unicode marker to remove left whitespace after template rendering
  @CLEAR_WHITESPACE_LEFT  = '\u0091'

# Hidden unicode marker to remove right whitespace after template rendering
  @CLEAR_WHITESPACE_RIGHT = '\u0092'

  # Constructs a syntax node
  #
  # @param [String] expression the Haml expression to evaluate
  # @param [Object] options the node options
  # @option options [Node] parentNode the parent node
  # @option options [Number] blockLevel the HTML block level
  # @option options [Number] codeBlockLevel the CoffeeScript block level
  # @option options [Boolean] escapeHtml whether to escape the rendered HTML or not
  # @option options [String] format the template format, either `xhtml`, `html4` or `html5`
  #
  constructor: (@expression = '', options = {}) ->
    @parentNode = options.parentNode
    @children   = []

    @opener = @closer = null

    @silent   = false
    @preserve = false

    @wsRemoval = {
      around: false
      inside: false
    }

    @escapeHtml        = options.escapeHtml
    @escapeAttributes  = options.escapeAttributes
    @format            = options.format

    @codeBlockLevel    = options.codeBlockLevel
    @blockLevel        = options.blockLevel

  # Add a child node.
  #
  # @param [Node] child the child node
  #
  addChild: (child) ->
    @children.push child
    @

  # Get the opening tag for the node.
  #
  # This may add a hidden unicode control character for
  # later whitespace processing:
  #
  # * \u0091 Cleanup surrounding whitespace to the left
  # * \u0092 Cleanup surrounding whitespace to the right
  #
  # @return [String] the opening tag
  #
  getOpener: ->
    @opener.text = Node.CLEAR_WHITESPACE_LEFT + @opener.text if @wsRemoval.around and @opener.text
    @opener.text += Node.CLEAR_WHITESPACE_RIGHT if @wsRemoval.inside and @opener.text

    @opener

  # Get the closing tag for the node.
  #
  # This may add a hidden unicode control character for
  # later whitespace processing:
  #
  # * \u0091 Cleanup surrounding whitespace to the left
  # * \u0092 Cleanup surrounding whitespace to the right
  #
  # @return [String] the closing tag
  #
  getCloser: ->
    @closer.text = Node.CLEAR_WHITESPACE_LEFT + @closer.text if @wsRemoval.inside and @closer.text
    @closer.text += Node.CLEAR_WHITESPACE_RIGHT if @wsRemoval.around and @closer.text

    @closer

  # Traverse up the tree to see if a parent node
  # is preserving output space.
  #
  # @return [Boolean] true when preserved
  #
  isPreserved: ->
    return true if @preserve

    if @parentNode
      @parentNode.isPreserved()
    else
      false

  # Get the indention for the HTML code. If the node
  # is preserved, then there is no indention.
  #
  # @return [Number] the number of spaces
  #
  getHtmlIndention: ->
    if @isPreserved() then 0 else @blockLevel

  # Creates a marker for static outputted text.
  #
  # @param [String] html the html to output
  # @param [Boolean] escape whether to escape the generated output
  # @return [Object] the marker
  #
  markText: (text, escape = false) ->
    {
      type    : 'text'
      cw      : @codeBlockLevel
      hw      : @getHtmlIndention()
      text    : if escape then e(text) else text?.replace(/"/g, '\\\"')
    }

  # Creates a marker for running CoffeeScript
  # code that doesn't generate any output.
  #
  # @param [String] code the CoffeeScript code
  # @return [Object] the marker
  #
  markRunningCode: (code) ->
    {
      type : 'run'
      cw   : @codeBlockLevel
      code : code
    }

  # Creates a marker for inserting CoffeeScript
  # code that generate an output.
  #
  # @param [String] code the CoffeeScript code
  # @param [Boolean] escape whether to escape the generated output
  # @return [Object] the marker
  #
  markInsertingCode: (code, escape = false) ->
    {
      type    : 'insert'
      cw      : @codeBlockLevel
      hw      : @getHtmlIndention()
      escape  : escape
      code    : code
    }

  # Template method that must be implemented by each
  # Node subclass. This evaluates the `@expression`
  # and save marks the output type on the `@opener` and
  # `@closer` attributes if applicable.
  #
  # @abstract
  #
  evaluate: ->

  # Render the node and its children.
  #
  # Always use `@opener` and `@closer` for content checks,
  # but `@getOpener()` and `@getCloser()` for outputting,
  # because they may contain whitespace removal control
  # characters.
  #
  # @return [Array] all markers
  #
  render: ->
    output = []

    # Swallow child output when silent
    return output if @silent

    # Nodes without children
    if @children.length is 0

      # Non self closing tag
      if @opener and @closer

        # Merge tag into a single line
        tag       = @getOpener()
        tag.text += @getCloser().text

        output.push tag

      # Self closing tag
      else

        # Whitespace preserved child tag are outputted by the preserving tag
        if not @preserve && @isPreserved()
          output.push @getOpener()

        # Normal self closing tag
        else
          output.push @getOpener()

    # Nodes with children
    else

      # Non self closing Haml tag
      if @opener and @closer

        # Whitespace preserving tag combines children into a single line
        if @preserve
          preserve  = @getOpener().text
          preserve += "#{ child.render()[0].text }\\n" for child in @children
          preserve  = preserve.replace(/\\n$/, '')
          preserve += @getCloser().text

          output.push @markText(preserve)

        # Non preserving tag
        else
          output.push @getOpener()
          output = output.concat(child.render()) for child in @children
          output.push @getCloser()

      # Block with only an opener
      else if @opener
        output.push @getOpener()
        output = output.concat(child.render()) for child in @children

      # Text and code node or Haml nodes without content
      else
        output.push @markText(child.render().text) for child in @children

    output
