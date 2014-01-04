Node      = require('./nodes/node')
Text      = require('./nodes/text')
Haml      = require('./nodes/haml')
Code      = require('./nodes/code')
Comment   = require('./nodes/comment')
Filter    = require('./nodes/filter')
Directive = require('./nodes/directive')

{whitespace} = require('./util/text')
{indent}     = require('./util/text')

# The HamlCoffee class is the compiler that parses the source code and creates an syntax tree.
# In a second step the created tree can be rendered into either a JavaScript function or a
# CoffeeScript template.
#
module.exports = class HamlCoffee

  # The current version number.
  @VERSION: require('../package.json').version

  # Construct the HAML Coffee compiler.
  #
  # @param [Object] options the compiler options
  # @option options [String] placement where to place the resultant function
  # @option options [Array<String>] dependencies dependencies for the amd module
  # @option options [Boolean] escapeHtml escape the output when true
  # @option options [Boolean] escapeAttributes escape the tag attributes when true
  # @option options [Boolean] cleanValue clean CoffeeScript values before inserting
  # @option options [Boolean] uglify don't indent generated HTML when true
  # @option options [Boolean] basename ignore file path when generate the template name
  # @option options [Boolean] extendScope extend the template scope with the context
  # @option options [String] format the template format, either `xhtml`, `html4` or `html5`
  # @option options [String] hyphenateDataAttrs whether to convert underscores to hyphens in data attributes
  # @option options [String] preserveTags a comma separated list of tags to preserve content whitespace
  # @option options [String] selfCloseTags a comma separated list of self closing HTML tags
  # @option options [String] customHtmlEscape the name of the function for HTML escaping
  # @option options [String] customCleanValue the name of the function to clean code insertion values before output
  # @option options [String] customFindAndPreserve the name of the function used to find and preserve whitespace
  # @option options [String] customPreserve the name of the function used to preserve the whitespace
  # @option options [String] customReference the name of the function used to create the id from object references
  #
  constructor: (@options = {}) ->
    @options.placement          ?= 'global'
    @options.dependencies       ?= { hc: 'hamlcoffee' }
    @options.escapeHtml         ?= true
    @options.escapeAttributes   ?= true
    @options.cleanValue         ?= true
    @options.uglify             ?= false
    @options.basename           ?= false
    @options.extendScope        ?= false
    @options.format             ?= 'html5'
    @options.hyphenateDataAttrs ?= true
    @options.preserveTags       ?= 'pre,textarea'
    @options.selfCloseTags      ?= 'meta,img,link,br,hr,input,area,param,col,base'

    if @options.placement is 'global'
      @options.name      ?= 'test'
      @options.namespace ?= 'window.HAML'

      # Create parameter name from the filename, e.g. a file `users/new.hamlc`
      # will create `window.HAML.user.new`
      segments = "#{ @options.namespace }.#{ @options.name }".replace(/(\s|-)+/g, '_').split(/\./)
      @options.name = if @options.basename then segments.pop().split(/\/|\\/).pop() else segments.pop()
      @options.namespace = segments.shift()

      # Create code for file and namespace creation
      @intro = ''
      if segments.length isnt 0
        for segment in segments
          @options.namespace += ".#{ segment }"
          @intro  += "#{ @options.namespace } ?= {}\n"
      else
        @intro += "#{ @options.namespace } ?= {}\n"

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

    # Do not validate within comments
    unless @node.isCommented()

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
      parentNode         : override.parentNode         || @parentNode
      blockLevel         : override.blockLevel         || @currentBlockLevel
      codeBlockLevel     : override.codeBlockLevel     || @currentCodeBlockLevel
      escapeHtml         : override.escapeHtml         || @options.escapeHtml
      escapeAttributes   : override.escapeAttributes   || @options.escapeAttributes
      cleanValue         : override.cleanValue         || @options.cleanValue
      format             : override.format             || @options.format
      hyphenateDataAttrs : override.hyphenateDataAttrs || @options.format
      preserveTags       : override.preserveTags       || @options.preserveTags
      selfCloseTags      : override.selfCloseTags      || @options.selfCloseTags
      uglify             : override.uglify             || @options.uglify
      placement          : override.placement          || @options.placement
      namespace          : override.namespace          || @options.namespace
      name               : override.name               || @options.name
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
    else if expression.match(/^(%|#[^{]|\.|\!)(.*)/)
      node = new Haml(expression, options)

    # Detect directive node
    else if expression.match(/^\+(.*)/)
      node = new Directive(expression, options)

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
    lines = source.replace(/\r/g, '').split("\n")

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
          range = if @tabSize > 2 then [@tabSize..1] else [2..1]
          for tabsize in range
            text = line.match(///^\s{#{ (@node.blockLevel * tabsize) + tabsize }}(.*)///)

            if text
              @node.addChild(new Text(text[1], @getNodeOptions({ parentNode: @node })))
              break

      # Normal line handling
      else

        # Clear exit filter flag
        @exitFilter = false

        # Get whitespace and Haml expressions
        result = line.match /^(\s*)(.*)/
        ws         = result[1]
        expression = result[2]

        @currentIndent = ws.length

        # Skip empty lines
        continue if /^\s*$/.test(line)

        # Look ahead for more attributes and add them to the current line
        while /^[%.#].*[{(]/.test(expression) and ///^\s{#{ @previousIndent + (@tabSize || 2) }}///.test(lines[0]) and not /^(\s*)[-=&!~.%#</]/.test(lines[0]) and /([-\w]+[\w:-]*\w?)\s*=|('\w+[\w:-]*\w?')\s*=|("\w+[\w:-]*\w?")\s*=|(\w+[\w:-]*\w?):|('[-\w]+[\w:-]*\w?'):|("[-\w]+[\w:-]*\w?"):|:(\w+[\w:-]*\w?)\s*=>|:?'([-\w]+[\w:-]*\w?)'\s*=>|:?"([-\w]+[\w:-]*\w?)"\s*=>/.test(lines[0]) and not /;\s*$/.test(lines[0])

          attributes = lines.shift()
          expression = expression.replace(/(\s)+\|\s*$/, '')
          expression += ' ' + attributes.match(/^\s*(.*?)(\s+\|\s*)?$/)[1]
          @lineNumber++

        # Ignore multiple commented lines
        while /^-#/.test(expression) and ///^\s{#{ @currentIndent + (@tabSize || 2) }}///.test(lines[0]) and lines.length > 0
          lines.shift()
          @lineNumber++

        # Look ahead for multi line |
        if expression.match(/(\s)+\|\s*$/)
          expression = expression.replace(/(\s)+\|\s*$/, ' ')

          while lines[0]?.match(/(\s)+\|$/)
            expression += lines.shift().match(/^(\s*)(.*)/)[2].replace(/(\s)+\|\s*$/, '')
            @lineNumber++

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
  render: ->
    switch @options.placement
      when 'amd'
        @renderAmd()
      when 'standalone'
        @renderStandalone()
      else
        @renderGlobal()

  # Render a standalone version
  renderStandalone: ->
    template = """
    return (context) ->
      (->
    #{indent(@precompile(), 2)}
      ).call(context)
    """

  # Render the parsed source code as CoffeeScript template wrapped in a
  # define() statement for AMD. If the global modules list contains a module
  # that starts with `hamlcoffee` and is assigned to the `hc` param, then
  # all known helper functions will be taken from the `hamlcoffee` helper
  # module.
  #
  # @private
  # @return [String] the CoffeeScript template source code
  #
  renderAmd: ->
    if /^hamlcoffee/.test @options.dependencies['hc']
      @options.customHtmlEscape = 'hc.escape'
      @options.customCleanValue = 'hc.cleanValue'
      @options.customPreserve = 'hc.preserve'
      @options.customFindAndPreserve = 'hc.findAndPreserve'
      @options.customSurround = 'hc.surround'
      @options.customSucceed = 'hc.succeed'
      @options.customPrecede = 'hc.precede'
      @options.customReference = 'hc.reference'

    modules = []
    params  = []

    for param, module of @options.dependencies
      modules.push module
      params.push param

    if @options.extendScope
      template = """
        `with (context || {}) {`
      #{ indent(@precompile(), 1) }
      `}`
      """
    else
      template = @precompile()

    for param, module of @findDependencies(template)
      modules.push module
      params.push param

    if modules.length isnt 0
      modules = for m in modules
        "'#{ m }'"

      modules = "[#{ modules }], (#{ params.join(', ') })"
    else
      modules = ''

    """
    define #{ modules } ->
      (context) ->
        render = ->
          \n#{ indent(template, 4) }
        render.call(context)
    """

  # Render the parsed source code as CoffeeScript template to a global
  # window.HAML variable.
  #
  # @private
  # @return [String] the CoffeeScript template source code
  #
  renderGlobal: ->
    # Use the existing intro that is generated at the constructor
    template = @intro

    # Render the template and extend the scope with the context
    if @options.extendScope
      template += "#{ @options.namespace }['#{ @options.name }'] = (context) -> ( ->\n"
      template += "  `with (context || {}) {`\n"
      template += "#{ indent(@precompile(), 1) }"
      template += "`}`\n"
      template += ").call(context)"

    # Render the template without extending the scope
    else
      template += "#{ @options.namespace }['#{ @options.name }'] = (context) -> ( ->\n"
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
                .replace(/\\//g, '&#47;')
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
        fn += "surround = (start, end, fn) => #{ @options.customSurround }.call(@, start, end, fn)\n"
      else
        fn += "surround = (start, end, fn) => start + fn.call(@)?.replace(/^\\s+|\\s+$/g, '') + end\n"

    # Succeed helper
    if code.indexOf('succeed') isnt -1
      if @options.customSucceed
        fn += "succeed = (start, end, fn) => #{ @options.customSucceed }.call(@, start, end, fn)\n"
      else
        fn += "succeed = (end, fn) => fn.call(@)?.replace(/\s+$/g, '') + end\n"

    # Precede helper
    if code.indexOf('precede') isnt -1
      if @options.customPrecede
        fn += "precede = (start, end, fn) => #{ @options.customPrecede }.call(@, start, end, fn)\n"
      else
        fn += "precede = (start, fn) => start + fn.call(@)?.replace(/^\s+/g, '')\n"

    # Generate object reference
    if code.indexOf('$r') isnt -1
      if @options.customReference
        fn += "$r = #{ @options.customReference }\n"
      else
        fn += """
              $r = (object, prefix) ->
                name = if prefix then prefix + '_' else ''

                if typeof(object.hamlObjectRef) is 'function'
                  name += object.hamlObjectRef()
                else
                  name += (object.constructor?.name || 'object').replace(/\W+/g, '_').replace(/([a-z\d])([A-Z])/g, '$1_$2').toLowerCase()

                id = if typeof(object.to_key) is 'function'
                       object.to_key()
                     else if typeof(object.id) is 'function'
                       object.id()
                     else if object.id
                       object.id
                    else
                      object

                result  = "class='\#{ name }'"
                result += " id='\#{ name }_\#{ id }'" if id\n
              """

    fn  += "$o = []\n"
    fn  += "#{ code }\n"
    fn  += "return $o.join(\"\\n\")#{ @convertBooleans(code) }#{ @removeEmptyIDAndClass(code) }#{ @cleanupWhitespace(code) }\n"

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
  # @param [String] code the CoffeeScript template code
  # @return [String] the clean up whitespace code if necessary
  #
  convertBooleans: (code) ->
    if code.indexOf('$c') isnt -1
      if @options.format is 'xhtml'
        '.replace(/\\s([\\w-]+)=\'\u0093true\'/mg, " $1=\'$1\'").replace(/\\s([\\w-]+)=\'\u0093false\'/mg, \'\')'
      else
        '.replace(/\\s([\\w-]+)=\'\u0093true\'/mg, \' $1\').replace(/\\s([\\w-]+)=\'\u0093false\'/mg, \'\')'
    else
      ''

  # Remove empty ID and class attribute from the
  # final template. In case of the ID this is required
  # in order to generate valid HTML.
  #
  # @param [String] code the CoffeeScript template code
  # @return [String] the template code with the code added
  #
  removeEmptyIDAndClass: (code) ->
    if code.indexOf('id=') isnt -1 || code.indexOf('class=') isnt -1
      '.replace(/\\s(?:id|class)=([\'"])(\\1)/mg, "")'
    else
      ''

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
  # @param [String] code the CoffeeScript template code
  # @return [String] the clean up whitespace code if necessary
  #
  cleanupWhitespace: (code) ->
    if /\u0091|\u0092/.test code
      ".replace(/[\\s\\n]*\\u0091/mg, '').replace(/\\u0092[\\s\\n]*/mg, '')"
    else
      ''

  # Searches for AMD require statements to find
  # all template dependencies.
  #
  # @example CST source code
  #   $o.push "" + $c require('assets/templates/test')()   =>   { test: 'assets/templates/test' }
  #
  # @param [String] code the CoffeeScript template source code
  # @return [Object] the module dependencies
  #
  findDependencies: (code) ->
    requireRegexp = /require(?:\s+|\()(['"])(.+?)(\1)\)?/gm
    dependencies = {}

    while match = requireRegexp.exec code
      module = match[2]
      name   = module.split('/').pop()

      dependencies[name] = module

    dependencies
