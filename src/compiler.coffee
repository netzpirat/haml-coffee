Node     = require('./nodes/node')
Text     = require('./nodes/text')
Haml     = require('./nodes/haml')
Code     = require('./nodes/code')
Comment  = require('./nodes/comment')
Filter   = require('./nodes/filter')
w        = require('./helper').whitespace

# The compiler class parses the source code and creates an syntax tree.
# In a second step the created tree can be rendered into a CoffeeScript
# template.
#
module.exports = class Compiler

  # Construct the HAML Coffee compiler.
  #
  # @param [Object] options the compiler options
  # @option options [Boolean] escape_haml whether to escape the output or not
  # @option options [String] format the template format, either `xhtml`, `html4` or `html5`
  #
  constructor: (@options = {}) ->
    @options.escapeHtml       ?= true
    @options.escapeAttributes ?= true
    @options.format           ?= 'html5'

  # Get the options for creating a node
  #
  # @return [Object] the node options
  #
  getNodeOptions: ->
    {
      parentNode       : @parentNode
      blockLevel       : @currentBlockLevel
      codeBlockLevel   : @currentCodeBlockLevel
      escapeHtml       : @options.escapeHtml
      escapeAttributes : @options.escapeAttributes
      format           : @options.format
    }

  # Get the matching node type for the given expression. This
  # is also responsible for creating the nested tree structure,
  # since there is an exception for creating the node tree:
  # Within a filter expression, any empty line without indention
  # is added as child to the previous filter expression.
  #
  # @param [String] expression the HAML expression
  # @return [Node] the parser node
  #
  nodeFactory: (expression = '') ->

    previousNode = @node
    options      = @getNodeOptions()

    # Detect empty line within a filter
    if expression is '' && previousNode instanceof Filter
      options.parentNode = previousNode.getFilterExpressionNode()
      node = new Filter(expression, options)

    # Detect filter expression node and nested children
    else if options.parentNode instanceof Filter || expression.match(/^:(escaped|preserve|css|javascript|plain)/)
      node = new Filter(expression, options)

    # Detect comment node
    else if expression.match(/^(\/|-#)(.*)/)
      node = new Comment(expression, options)

    # Detect code node
    else if expression.match(/^(-#|-|=|!=|\&=|~)\s*(.*)/)
      node = new Code(expression, options)

    # Detect Haml node
    else if expression.match(/^(%|#|\.|\!)(.*)/)
      node = new Haml(expression, options)

    # Everything else is a text node
    else
      node = new Text(expression, options)

    options.parentNode?.addChild(node)

    node

  # Update the indention level for a code block.
  #
  # @param [Node] node the node to update
  #
  updateCodeBlockLevel: (node) ->
    if node instanceof Code
      @currentCodeBlockLevel = node.codeBlockLevel + 1
    else
      @currentCodeBlockLevel = node.codeBlockLevel

  # Test if the indention level has changed, either
  # increased or decreased.
  #
  # @return [Boolean] true when indention changed
  #
  #
  indentChanged: ->
    @currentIndent != @previousIndent

  # Test if the indention levels has been increased.
  #
  # @return [Boolean] true when increased
  #
  isIndent: ->
    @currentIndent > @previousIndent

  # Calculate the indention size
  #
  updateTabSize: ->
     @tabSize = @currentIndent - @previousIndent if @tabSize == 0

  # Update the current block level indention.
  #
  updateBlockLevel: ->
    @currentBlockLevel = @currentIndent / @tabSize

    # Validate current indention
    if @currentBlockLevel - Math.floor(@currentBlockLevel) > 0
      throw("Indentation error in line #{ @line_number }") if not (@node instanceof Filter)

    # Validate block level
    if (@currentIndent - @previousIndent) / @tabSize > 1
      throw("Block level too deep in line #{ @line_number }") if not (@node instanceof Filter)

    # Set the indention delta
    @delta = @previousBlockLevel - @currentBlockLevel

  # Indention level has been increased:
  # Push the current parent node to the stack and make
  # the current node the parent node.
  #
  pushParent: ->
    @stack.push @parentNode
    @parentNode = @node

  # Indention level has been decreased:
  # Make the grand parent the current parent.
  #
  popParent: ->
    for i in [0..@delta-1]
      @parentNode = @stack.pop()

  # Parse the given source and create the nested node
  # structure. This parses the source code line be line, but
  # looks ahead to find lines that should be merged into the current line.
  # This is needed for splitting Haml attributes over several lines
  # and also for the different types of filters.
  #
  # Parsing does not create an output, it creates the syntax tree in the
  # compiler. To get the template, use `#render`.
  #
  # @param source [String] the HAML source code
  #
  parse: (source) ->
    # Initialize line and indent markers
    @line_number = @previousIndent = @tabSize = @currentBlockLevel = @previousBlockLevel = 0
    @currentCodeBlockLevel = @previousCodeBlockLevel = 2

    # Initialize nodes
    @node = null
    @stack = []
    @root = @parentNode = new Node('', @getNodeOptions())

    # Keep lines for look ahead
    lines = source.split("\n")

    # Parse source line by line
    while (line = lines.shift()) isnt undefined

      # Skip empty lines, expect within a filter
      continue if line is '' and not(@node instanceof Filter)

      # Get whitespace and Haml expressions
      result = line.match /^(\s*)(.*)/
      whitespace = result[1]
      expression = result[2]

      # Look ahead for more attributes
      while expression.match(/^%/) and not lines[0]?.match(/^(\s*)%/) and lines[0]?.match /([^:|\s|=]+\s*=>\s*(("[^"]+")|('[^']+')|[^\s,\}]+))|([\w]+=(("[^"]+")|('[^']+')|[^\s\)]+))/g
        attributes = lines.shift()
        expression += ' ' + attributes.match(/^(\s*)(.*)/)[2]
        @line_number++

      @currentIndent = whitespace.length

      # Update indention levels and set the current parent
      if @indentChanged()
        @updateTabSize()
        @updateBlockLevel()
        if @isIndent() then @pushParent() else @popParent()
        @updateCodeBlockLevel(@parentNode)

      # Create current node
      @node = @nodeFactory(expression)

      # Save previous indention levels
      @previousBlockLevel = @currentBlockLevel
      @previousIndent = @currentIndent

      @line_number++

    @evaluate(@root)

  # Evaluate the parsed tree
  #
  # @param [Node] node the node to evaluate
  #
  evaluate: (node) ->
    @evaluate(child) for child in node.children
    node.evaluate()

  # Render the parsed source code as CoffeeScript template.
  #
  # @param [String] templateName the name to register the template
  # @param [String] namespace the namespace to register the template
  #
  render: (templateName, namespace = 'window.HAML') ->
    output = ''

    # Create parameter name from the filename, e.g. a file `users/new.hamlc`
    # will create `window.HAML.user.new`
    segments     = "#{ namespace }.#{ templateName }".replace(/(\s|-)+/g, '_').split(/\.|\//)
    templateName = segments.pop()
    namespace    = segments.shift()

    # Create code for file and namespace creation
    for segment in segments
      namespace += ".#{ segment }"
      output    += "#{ namespace } ?= {}\n"

    # Always include escape function in the template, since escaping
    # can be forced with `&=` event when turned off
    if @options.customHtmlEscape
      escapeFn = @options.customHtmlEscape
    else
      escapeFn = "#{ namespace }.htmlEscape"
      output +=
        escapeFn +
          '''
          ||= (text) ->
            "#{ text }"
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\'/g, '&apos;')
            .replace(/\"/g, '&quot;')\n
          '''

    # Render the template
    output += "#{ namespace }.#{ templateName } = (context) ->\n"
    output += "  fn = (context) ->\n"
    output += "    o = []\n"
    output += "    e = #{ escapeFn }\n"
    code    = @createCode()
    output += "#{ code }\n"
    output += "    return o.join(\"\\n\")#{ @cleanupWhitespace(code) }\n"
    output += "  return fn.call(context)"

    output

  # Create the CoffeeScript code for the template.
  #
  # This gets an array of all lines to be rendered in
  # the correct sequence.
  #
  # @return [String] the CoffeeScript code
  #
  createCode: ->
    code  = []

    @lines = []
    @lines = @lines.concat(child.render()) for child in @root.children

    for line in @lines
      unless line is null
        switch line.type

          # Insert static HTML tag
          when 'text'
            code.push "#{ w(line.cw) }o.push \"#{ w(line.hw) }#{ line.text }\""

          # Insert code that is only evaluated and doesn't generate any output
          when 'run'
            code.push "#{ w(line.cw) }#{ line.code }"

          # Insert code that is evaluated and generates an output
          when 'insert'
            if line.hw is 0
              code.push "#{ w(line.cw) }o.push #{ if w(line.escape) then 'e ' else '' }#{ line.code }"
            else
              code.push "#{ w(line.cw) }o.push #{ if w(line.escape) then 'e' else '' } \"#{ w(line.hw) }\" + #{ line.code }"

    code.join '\n'

  # Adds whitespace cleanup function when needed by the
  # template. The cleanup must be done AFTER the template
  # has been rendered.
  #
  # The detection is based on hidden unicode characters that
  # are placed as marker into the template:
  #
  # * \u0091 Cleanup surrounding whitespace to the left
  # * \u0092 Cleanup surrounding whitespace to the right
  #
  cleanupWhitespace: (code) ->
    if /\u0091|\u0092/.test code
      ".replace(/[\\s\\n]*\\u0091/mg, '').replace(/\\u0092[\\s\\n]*/mg, '')"
    else
      ''
