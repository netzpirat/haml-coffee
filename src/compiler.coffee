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
    @options.preserveTags     ?= 'pre,textarea'

  # Test if the indention level has changed, either
  # increased or decreased.
  #
  # @return [Boolean] true when indention changed
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
      throw("Indentation error in line #{ @lineNumber }")

    # Validate block level
    if (@currentIndent - @previousIndent) / @tabSize > 1
      throw("Block level too deep in line #{ @lineNumber }")

    # Set the indention delta
    @delta = @previousBlockLevel - @currentBlockLevel

  # Update the indention level for a code block.
  #
  # @param [Node] node the node to update
  #
  updateCodeBlockLevel: (node) ->
    if node instanceof Code
      @currentCodeBlockLevel = node.codeBlockLevel + 1
    else
      @currentCodeBlockLevel = node.codeBlockLevel

  # Update the parent node. This depends on the indention
  # if stays the same, goes one down or on up.
  #
  updateParent: ->
    if @isIndent()
      @pushParent()
    else
      @popParent()

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

  # Get the options for creating a node
  #
  # @param [Object] override the options to override
  # @return [Object] the node options
  #
  getNodeOptions: (override = {})->
    {
      parentNode       : override.parentNode       || @parentNode
      blockLevel       : override.blockLevel       || @currentBlockLevel
      codeBlockLevel   : override.codeBlockLevel   || @currentCodeBlockLevel
      escapeHtml       : override.escapeHtml       || @options.escapeHtml
      escapeAttributes : override.escapeAttributes || @options.escapeAttributes
      format           : override.format           || @options.format
      preserveTags     : override.preserveTags     || @options.preserveTags
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

    options = @getNodeOptions()

    # Detect filter node
    if expression.match(/^:(escaped|preserve|css|javascript|plain|cdata|coffeescript)/)
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

      # After a filter, all lines are captured as text nodes until the end of the filer
      if (@node instanceof Filter) and not @exitFilter

        # Blank lines within a filter goes into the filter
        if /^(\s)*$/.test(line)
          @node.addChild(new Text('', @getNodeOptions({ parentNode: @node })))

        # Detect if filter ends or if there is more text
        else
          result = line.match /^(\s*)(.*)/
          whitespace = result[1]
          expression = result[2]

          # When on the same or less indent as the filter, exit and continue normal parsing
          if @node.blockLevel >= (whitespace.length / 2)
            @exitFilter = true
            lines.unshift line
            continue

          # Get the filter text and remove filter node + indention whitespace
          text = line.match ///^\s{#{ (@node.blockLevel * 2) + 2 }}(.*)///
          @node.addChild(new Text(text[1], @getNodeOptions({ parentNode: @node }))) if text

      # Normal line handling
      else

        # Clear exit filter flag
        @exitFilter = false

        # Get whitespace and Haml expressions
        result = line.match /^(\s*)(.*)/
        whitespace = result[1]
        expression = result[2]

        # Skip empty lines
        continue if /^(\s)*$/.test(line)

        # Look ahead for more attributes and add them to the current line
        while /^%.*[{(]/.test(expression) and not /^(\s*)[.%#<]/.test(lines[0]) and /(?:(\w+[\w:-]*\w?|'\w+[\w:-]*\w?'|"\w+[\w:-]*\w?")\s*=\s*("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[\w@.]+)|(:\w+[\w:-]*\w?|'\w+[\w:-]*\w?'|"\w+[\w:-]*\w?")\s*=>\s*("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[-\w@.()\[\]'"]+)|(\w+[\w:-]*\w?|'\w+[\w:-]*\w?'|'\w+[\w:-]*\w?'):\s*("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[-\w@.()\[\]'"]+))/.test(lines[0])

          attributes = lines.shift()
          expression += ' ' + attributes.match(/^(\s*)(.*)/)[2]
          @line_number++

        # Look ahead for multi line |
        if expression.match(/(\s)+\|$/)
          expression = expression.replace(/(\s)+\|$/, ' ')

          while lines[0]?.match(/(\s)+\|$/)
            expression += lines.shift().match(/^(\s*)(.*)/)[2].replace(/(\s)+\|$/, '')
            @line_number++

        @currentIndent = whitespace.length

        # Update indention levels and set the current parent
        if @indentChanged()
          @updateTabSize()
          @updateBlockLevel()
          @updateParent()
          @updateCodeBlockLevel(@parentNode)

        # Create current node
        @node = @nodeFactory(expression)

        # Save previous indention levels
        @previousBlockLevel = @currentBlockLevel
        @previousIndent     = @currentIndent

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
    segments     = "#{ namespace }.#{ templateName }".replace(/(\s|-)+/g, '_').split(/\./)
    templateName = segments.pop()
    namespace    = segments.shift()

    # Create code for file and namespace creation
    if segments.length isnt 0
      for segment in segments
        namespace += ".#{ segment }"
        output    += "#{ namespace } ?= {}\n"
    else
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
          ||= (text, escape) ->
            "#{ text }"
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\'/g, '&apos;')
            .replace(/\"/g, '&quot;')\n
          '''

    # Check rendered attribute values
    if @options.customCleanValue
      cleanFn = @options.customCleanValue
    else
      cleanFn = "#{ namespace }.cleanValue"
      output +=
        cleanFn +
          '''
          ||= (text) -> if text is null or text is undefined then '' else text\n
          '''

    if @options.customPreserve
      preserveFn = @options.customPreserve
    else
      preserveFn = "#{ namespace }.preserve"
      output +=
        preserveFn +
          """
          ||= (text) -> text.replace /\\n/g, '&#x000A;'\n
          """

    if @options.customFindAndPreserve
      findAndPreserveFn = @options.customFindAndPreserve
    else
      findAndPreserveFn = "#{ namespace }.findAndPreserve"
      output +=
        findAndPreserveFn +
          """
          ||= (text) ->
            text.replace /<(#{ @options.preserveTags.split(',').join('|') })>([^]*?)<\\/\\1>/g, (str, tag, content) ->
              "<\#{ tag }>\#{ #{ preserveFn }(content) }</\#{ tag }>"\n
          """

    # Render the template
    output += "#{ namespace }['#{ templateName }'] = (context) ->\n"
    output += "  fn = (context) ->\n"
    output += "    o = []\n"
    output += "    e = #{ escapeFn }\n"
    output += "    c = #{ cleanFn }\n"
    output += "    p = #{ preserveFn }\n"
    output += "    fp = findAndPreserve = #{ findAndPreserveFn }\n"
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
              code.push "#{ w(line.cw) }o.push #{ if w(line.findAndPreserve) then 'fp ' else '' }#{ if w(line.preserve) then 'p ' else '' }#{ if w(line.escape) then 'e ' else '' }c #{ line.code }"
            else
              code.push "#{ w(line.cw) }o.push \"#{ w(line.hw - line.cw + 2) }\" + #{ if w(line.findAndPreserve) then 'fp ' else '' }#{ if w(line.preserve) then 'p ' else '' }#{ if w(line.escape) then 'e ' else '' }c #{ line.code }"

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
