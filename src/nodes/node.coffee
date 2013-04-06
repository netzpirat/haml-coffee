{escapeHTML} = require('../util/text')

# Base class for the syntax tree.
#
# This will provide some methods that subclasses must use in order to generate
# some output:
#
# * {#markText}
# * {#markRunningCode}
# * {#markInsertingCode}
#
# Each node must mark the `@opener` attribute and can optionally mark the `@closer`
# attribute.
#
# @abstract
#
module.exports = class Node

  # Hidden unicode marker to remove left whitespace after template rendering.
  @CLEAR_WHITESPACE_LEFT  = '\u0091'

  # Hidden unicode marker to remove right whitespace after template rendering.
  @CLEAR_WHITESPACE_RIGHT = '\u0092'

  # Constructs a syntax node.
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

    # A silent node swallows all output
    @silent   = false

    # Preserve whitespace on all children
    @preserveTags = options.preserveTags.split(',')
    @preserve = false

    @wsRemoval = {
      around: false
      inside: false
    }

    @escapeHtml         = options.escapeHtml
    @escapeAttributes   = options.escapeAttributes
    @cleanValue         = options.cleanValue
    @format             = options.format
    @hyphenateDataAttrs = options.hyphenateDataAttrs
    @selfCloseTags      = options.selfCloseTags.split(',')
    @uglify             = options.uglify

    @codeBlockLevel     = options.codeBlockLevel
    @blockLevel         = options.blockLevel

    @placement          = options.placement
    @namespace          = options.namespace
    @name               = options.name

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
  # * `\u0091` Cleanup surrounding whitespace to the left
  # * `\u0092` Cleanup surrounding whitespace to the right
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
  # * `\u0091` Cleanup surrounding whitespace to the left
  # * `\u0092` Cleanup surrounding whitespace to the right
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

  # Traverse up the tree to see if a parent node
  # is a comment node.
  #
  # @return [Boolean] true when within a comment
  #
  isCommented: ->
    return true if @constructor.name is 'Comment'

    if @parentNode
      @parentNode.isCommented()
    else
      false

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
      hw      : if @uglify then 0 else @blockLevel - @codeBlockLevel
      text    : if escape then escapeHTML(text) else text
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
  # @param [Boolean] preserve when preserve all newlines
  # @param [Boolean] findAndPreserve when preserve newlines within preserved tags
  # @return [Object] the marker
  #
  markInsertingCode: (code, escape = false, preserve = false, findAndPreserve = false) ->
    {
      type            : 'insert'
      cw              : @codeBlockLevel
      hw              : if @uglify then 0 else @blockLevel - @codeBlockLevel
      escape          : escape
      preserve        : preserve
      findAndPreserve : findAndPreserve
      code            : code
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

          # Preserved tags removes the inside whitespace
          @wsRemoval.inside = true

          output.push @getOpener()

          for child in @children
            for rendered in child.render()
              # Move all children's block level to the preserving tag
              rendered.hw = @blockLevel
              output.push rendered

          output.push @getCloser()

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
