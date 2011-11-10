e = require('../helper').escape
w = require('../helper').whitespace

# Base class for the syntax tree.
# A node that is silent will swallow it's children output.
#
module.exports = class Node

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
    @children = []

    @opener = @closer = ''

    @silent   = false
    @preserve = false
    @newline  = true

    @escapeHtml        = options.escapeHtml
    @escapeAttributes  = options.escapeAttributes
    @format            = options.format
    @codeBlockLevel    = options.codeBlockLevel
    @blockLevel        = options.blockLevel

    @codeWhitespace    = w(@codeBlockLevel)
    @htmlWhitespace    = w(@blockLevel)

    @evaluate()

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
  getOpener: -> @opener

  # Get the closing tag for the node.
  #
  # @return [String] the closing tag
  #
  getCloser: -> @closer

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
  # @return [String] a string of spaces
  #
  getHtmlIndention: ->
    if @isPreserved() then '' else @htmlWhitespace

  # Creates the CoffeeScript code that outputs
  # the given static HTML.
  #
  # @param [String] html the html to output
  # @return [String] the CoffeeScript code
  #
  outputHtml: (html) ->
    "#{ @codeWhitespace }o.push \"#{ @getHtmlIndention() }#{ html }\"\n"

  # Adds the CoffeeScript code to the template
  # to be run at render time.
  #
  # @param [String] code the CoffeeScript code
  # @return [String] the CoffeeScript code
  #
  outputCode: (code) ->
    "#{ @codeWhitespace }#{ code }\n"

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
      "#{ @codeWhitespace }o.push e \"#{ @getHtmlIndention() }\#{#{ code }}\"\n"
    else
      "#{ @codeWhitespace }o.push \"#{ @getHtmlIndention() }\#{#{ code }}\"\n"

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

        # Whitespace preserved child tag are outputted by the preserving tag
        if not @preserve && @isPreserved()
          output = @getOpener()

        # Normal self closing tag
        else
          output = @outputHtml(@getOpener())

    # Nodes with children
    else

      # Non self closing Haml tag
      if @getOpener().length > 0 && @getCloser().length > 0

        # Whitespace preserving tag
        if @preserve
          output = @getOpener()
          output += "#{ child.render() }\\n" for child in @children
          output = output.replace(/\\n$/, '')
          output += @getCloser()
          output = @outputHtml(output)

        # Non preserving tag
        else
          output = @outputHtml(@getOpener())
          output += child.render() for child in @children
          output += @outputHtml(@getCloser())

      # Text and code node or Haml nodes without content (e.g. the root node)
      # A code node is set to `silent` when it contains a silent comment.
      else
        unless @silent
          for child in @children
            output += child.render()

    output

  # Apply the whitespace removal by traversing the
  # tree and adjust @newline to false where necessary.
  #
  applyWhitespaceRemoval: ->
    child.applyWhitespaceRemoval() for child in @children

    # Inline whitespace cleanup
    @newline = false if @wsRemoval is '<'

    # Surrounding whitespace cleanup
    @applySurroundingWhitespaceRemoval() if @wsRemoval is '>'

  # Apply the surrounding whitespace removal strategy.
  #
  # When a node is marked to remove surrounding whitespace
  # it will mark its siblings to remove whitespace also.
  #
  applySurroundingWhitespaceRemoval: ->

    # Find position
    siblings = @parentNode.children
    position = siblings.indexOf(@)

    # Mark surrounding siblings
    siblings[position - 1]?.newline = false
    @newline = false
    siblings[position + 1]?.newline = false

    # Mark parent node when current node is the first child
    @parentNode.newline = false unless siblings[position - 1]
