Node    = require('./nodes/node')
Text    = require('./nodes/text')
Haml    = require('./nodes/haml')
Code    = require('./nodes/code')
Comment = require('./nodes/comment')
Filter  = require('./nodes/filter')

{whitespace} = require('./util/text')
{indent}     = require('./util/text')

# The HamlCoffee class is the compiler that parses the source code and creates an syntax tree.
# In a second step the created tree can be rendered into either a JavaScript function or a
# CoffeeScript template.
#
module.exports = class HamlCoffee

  # Construct the HAML Coffee compiler.
  #
  # @param [Object] options the compiler options
  # @option options [Boolean] escapeHtml escape the output when true
  # @option options [Boolean] escapeAttributes escape the tag attributes when true
  # @option options [Boolean] cleanValue clean CoffeeScript values before inserting
  # @option options [Boolean] uglify don't indent generated HTML when true
  # @option options [Boolean] basename ignore file path when generate the template name
  # @option options [Boolean] extendScope extend the template scope with the context 
  # @option options [String] format the template format, either `xhtml`, `html4` or `html5`
  # @option options [String] preserveTags a comma separated list of tags to preserve content whitespace
  # @option options [String] selfCloseTags a comma separated list of self closing HTML tags
  # @option options [String] customHtmlEscape the name of the function for HTML escaping
  # @option options [String] customCleanValue the name of the function to clean code insertion values before output
  # @option options [String] customFindAndPreserve the name of the function used to find and preserve whitespace
  # @option options [String] customPreserve the name of the function used to preserve the whitespace
  #
  constructor: (@options = {}) ->
    @options.escapeHtml       ?= true
    @options.escapeAttributes ?= true
    @options.cleanValue       ?= true
    @options.uglify           ?= false
    @options.basename         ?= false
    @options.extendScope      ?= false
    @options.format           ?= 'html5'
    @options.preserveTags     ?= 'pre,textarea'
    @options.selfCloseTags    ?= 'meta,img,link,br,hr,input,area,param,col,base'

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
      # Ignore block level indention errors within comments
      unless @node.isCommented()
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
      cleanValue       : override.cleanValue       || @options.cleanValue
      format           : override.format           || @options.format
      preserveTags     : override.preserveTags     || @options.preserveTags
      selfCloseTags    : override.selfCloseTags    || @options.selfCloseTags
      uglify           : override.uglify           || @options.uglify
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
  # @param [String] source the HAML source code
  #
  parse: (source = '') ->
    # Initialize line and indent markers
    @lineNumber = @previousIndent = @tabSize = @currentBlockLevel = @previousBlockLevel = 0
    @currentCodeBlockLevel = @previousCodeBlockLevel = 0

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
          ws         = result[1]
          expression = result[2]

          # When on the same or less indent as the filter, exit and continue normal parsing
          if @node.blockLevel >= (ws.length / 2)
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
        ws         = result[1]
        expression = result[2]

        # Skip empty lines
        continue if /^\s*$/.test(line)

        # Look ahead for more attributes and add them to the current line
        while /^[%.#].*[{(]/.test(expression) and not /^(\s*)[-=&!~.%#<]/.test(lines[0]) and /([-\w]+[\w:-]*\w?)\s*=|('\w+[\w:-]*\w?')\s*=|("\w+[\w:-]*\w?")\s*=|(\w+[\w:-]*\w?):|('[-\w]+[\w:-]*\w?'):|("[-\w]+[\w:-]*\w?"):|:(\w+[\w:-]*\w?)\s*=>|:?'([-\w]+[\w:-]*\w?)'\s*=>|:?"([-\w]+[\w:-]*\w?)"\s*=>/.test(lines[0])

          attributes = lines.shift()
          expression = expression.replace(/(\s)+\|\s*$/, '')
          expression += ' ' + attributes.match(/^\s*(.*?)(\s+\|\s*)?$/)[1]
          @lineNumber++

        # Look ahead for multi line |
        if expression.match(/(\s)+\|\s*$/)
          expression = expression.replace(/(\s)+\|\s*$/, ' ')

          while lines[0]?.match(/(\s)+\|$/)
            expression += lines.shift().match(/^(\s*)(.*)/)[2].replace(/(\s)+\|\s*$/, '')
            @lineNumber++

        @currentIndent = ws.length

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

      @lineNumber++

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
    template = ''

    # Create parameter name from the filename, e.g. a file `users/new.hamlc`
    # will create `window.HAML.user.new`
    segments     = "#{ namespace }.#{ templateName }".replace(/(\s|-)+/g, '_').split(/\./)
    templateName = if @options.basename then segments.pop().split(/\/|\\/).pop() else segments.pop()
    namespace    = segments.shift()

    # Create code for file and namespace creation
    if segments.length isnt 0
      for segment in segments
        namespace += ".#{ segment }"
        template  += "#{ namespace } ?= {}\n"
    else
      template += "#{ namespace } ?= {}\n"

    # Render the template and extend the scope with the context
    if @options.extendScope
      template += "#{ namespace }['#{ templateName }'] = (context) -> ( ->\n"
      template += "  `with (context || {}) {`\n"
      template += "#{ indent(@precompile(), 1) }"
      template += "`}`\n"
      template += ").call(context)"

    # Render the template without extending the scope
    else
      template += "#{ namespace }['#{ templateName }'] = (context) -> ( ->\n"
      template += "#{ indent(@precompile(), 1) }"
      template += ").call(context)"

    template

  # Pre-compiles the parsed source and generates
  # the function source code.
  #
  # @return [String] the template function source code
  #
  precompile: ->
    fn = ''
    code = @createCode()

    # Escape HTML entities
    if code.indexOf('$e') isnt -1
      if @options.customHtmlEscape
        fn += "$e = #{ @options.customHtmlEscape }\n"
      else
        fn += """
              $e = (text, escape) ->
                "\#{ text }"
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\'/g, '&#39;')
                .replace(/\"/g, '&quot;')\n
              """

    # Check values generated from template code
    if code.indexOf('$c') isnt -1
      if @options.customCleanValue
        fn += "$c = #{ @options.customCleanValue }\n"
      else
        fn += "$c = (text) ->\n"
        fn += "   switch text\n"
        fn += "     when null, undefined then ''\n"
        fn += "     when true, false then '\u0093' + text\n"
        fn += "     else text\n"

    # Preserve whitespace
    if code.indexOf('$p') isnt -1 || code.indexOf('$fp') isnt -1
      if @options.customPreserve
        fn += "$p = #{ @options.customPreserve }\n"
      else
        fn += "$p = (text) -> text.replace /\\n/g, '&#x000A;'\n"

    # Find whitespace sensitive tags and preserve
    if code.indexOf('$fp') isnt -1
      if @options.customFindAndPreserve
        fn += "$fp = #{ @options.customFindAndPreserve }\n"
      else
        fn +=
          """
          $fp = (text) ->
            text.replace /<(#{ @options.preserveTags.split(',').join('|') })>([^]*?)<\\/\\1>/g, (str, tag, content) ->
              "<\#{ tag }>\#{ $p content }</\#{ tag }>"\n
          """

    # Surround helper
    if code.indexOf('surround') isnt -1
      if @options.customSurround
        fn += "surround = #{ @options.customSurround }\n"
      else
        fn += "surround = (start, end, fn) -> start + fn() + end\n"

    # Succeed helper
    if code.indexOf('succeed') isnt -1
      if @options.customSucceed
        fn += "succeed = #{ @options.customSucceed }\n"
      else
        fn += "succeed = (end, fn) -> fn() + end\n"

    # Precede helper
    if code.indexOf('precede') isnt -1
      if @options.customPrecede
        fn += "precede = #{ @options.customPrecede }\n"
      else
        fn += "precede = (start, fn) -> start + fn()\n"

    fn  += "$o = []\n"
    fn  += "#{ code }\n"
    fn  += "return $o.join(\"\\n\")#{ @convertBooleans(code) }#{ @cleanupWhitespace(code) }\n"

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
    @lines = @combineText(@lines)

    @blockLevel = 0

    for line in @lines
      unless line is null
        switch line.type

          # Insert static HTML tag
          when 'text'
            code.push "#{ whitespace(line.cw) }#{ @getBuffer(@blockLevel) }.push \"#{ whitespace(line.hw) }#{ line.text }\""

          # Insert code that is only evaluated and doesn't generate any output
          when 'run'
            if line.block isnt 'end'
              code.push "#{ whitespace(line.cw) }#{ line.code }"
            # End a block
            else
              code.push "#{ whitespace(line.cw) }#{ line.code.replace '$buffer', @getBuffer(@blockLevel) }"
              @blockLevel -= 1

          # Insert code that is evaluated and generates an output
          when 'insert'
            processors  = ''
            processors += '$fp ' if line.findAndPreserve
            processors += '$p '  if line.preserve
            processors += '$e '  if line.escape
            processors += '$c '  if @options.cleanValue

            code.push "#{ whitespace(line.cw) }#{ @getBuffer(@blockLevel) }.push \"#{ whitespace(line.hw) }\" + #{ processors }#{ line.code }"

            # Initialize block output
            if line.block is 'start'
              @blockLevel += 1
              code.push "#{ whitespace(line.cw + 1) }#{ @getBuffer(@blockLevel) } = []"

    code.join '\n'

  # Get the code buffer identifer
  #
  # @param [Number] level the block indention level
  #
  getBuffer: (level) ->
    if level > 0 then "$o#{ level }" else '$o'

  # Optimize the lines to be rendered by combining subsequent text
  # nodes that are on the same code line indention into a single line.
  #
  # @param [Array<Object>] lines the code lines
  # @return [Array<Object>] the optimized lines
  #
  combineText: (lines) ->
    combined = []

    while (line = lines.shift()) isnt undefined
      if line.type is 'text'
        while lines[0] and lines[0].type is 'text' and line.cw is lines[0].cw
          nextLine = lines.shift()
          line.text += "\\n#{ whitespace(nextLine.hw) }#{ nextLine.text }"

      combined.push line

    combined

  # Adds a boolean convert logic that changes boolean attribute
  # values depending on the output format. This works only when
  # the clean value function add a hint marker (\u0093) to each
  # boolean value, so that the conversion logic can disinguish
  # between dynamic, real boolean values and string values like
  # 'false' and 'true' or  compile time attributes.
  #
  # With the XHTML format, an attribute `checked='true'` will be
  # converted to `checked='checked'` and `checked='false'` will
  # be completely removed.
  #
  # With the HTML4 and HTML5 format, an attribute `checked='true'`
  # will be converted to `checked` and `checked='false'` will
  # be completely removed.
  #
  # @return [String] the clean up whitespace code if necessary
  #
  convertBooleans: (code) ->
    if @options.format is 'xhtml'
      '.replace(/\\s(\\w+)=\'\u0093true\'/mg, " $1=\'$1\'").replace(/\\s(\\w+)=\'\u0093false\'/mg, \'\')'
    else
      '.replace(/\\s(\\w+)=\'\u0093true\'/mg, \' $1\').replace(/\\s(\\w+)=\'\u0093false\'/mg, \'\')'

  # Adds whitespace cleanup function when needed by the
  # template. The cleanup must be done AFTER the template
  # has been rendered.
  #
  # The detection is based on hidden unicode characters that
  # are placed as marker into the template:
  #
  # * `\u0091` Cleanup surrounding whitespace to the left
  # * `\u0092` Cleanup surrounding whitespace to the right
  #
  # @param [String] code the template code
  # @return [String] the clean up whitespace code if necessary
  #
  cleanupWhitespace: (code) ->
    if /\u0091|\u0092/.test code
      ".replace(/[\\s\\n]*\\u0091/mg, '').replace(/\\u0092[\\s\\n]*/mg, '')"
    else
      ''
