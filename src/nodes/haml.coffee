Node  = require('./node')

{escapeQuotes} = require('../util/text')

# HAML node that contains Haml a haml tag that can have attributes
# and a text or code assignment. There are shortcuts for id and class
# generation and some special logic for merging attributes into existing
# ids and classes.
#
# @example Haml tag
#   %footer                               =>  <footer></footer>
#
# @example Haml id
#   #content                              =>  <div id='content'></div>
#   %span#status{ :id => @user.status }   =>  <span id='status_#{ @user.status }'></span>
#
# @example Haml classes
#   .hidden                               => <div class='hidden'></div>
#   %span.large.hidden                    => <span class='large hidden'></span>
#   .large{ :class => @user.role }        => <div class='large #{ @user.role }'></div>
#
# Haml HTML attributes are very limited and allows only simple string
# (with interpolation) or variable assignment to an attribute.
#
# @example Haml HTML attributes
#   %p(class='hidden')                     => <p class='hidden'><p>
#   #account(class=@status)                => <div id='account' class='#{ status }'></div>
#   .logout(title="Logout #{ user.name }") => <div class='logout' title='Logout #{ user.name }'></div>
#
# Ruby HTML attributes are more powerful and allows in addition to the
# HTML attributes function calls:
#
# @example Haml Ruby attributes
#   %p{ :class => App.user.get('role') }   => <p class='#{ App.user.get('role') }'></p>
#
module.exports = class Haml extends Node

  # Evaluate the node content and store the opener tag
  # and the closer tag if applicable.
  #
  evaluate: ->
    tokens = @parseExpression(@expression)

    # Evaluate Haml doctype
    if tokens.doctype
      @opener = @markText "#{ escapeQuotes(@buildDocType(tokens.doctype)) }"

    # Evaluate Haml tag
    else
      # Create a Haml node that can contain child nodes
      if @isNotSelfClosing(tokens.tag)

        prefix = @buildHtmlTagPrefix(tokens)

        # Add Haml tag that contains a code assignment will be closed immediately
        if tokens.assignment

          match = tokens.assignment.match /^(=|!=|&=|~)\s*(.*)$/

          identifier = match[1]
          assignment = match[2]

          if identifier is '~'
            code = "\#{$fp #{ assignment } }"

          # Code block with escaped code block, either `=` in escaped mode or `&=`
          else if identifier is '&=' or (identifier is '=' and @escapeHtml)
            if @preserve
              if @cleanValue
                code = "\#{ $p($e($c(#{ assignment }))) }"
              else
                code = "\#{ $p($e(#{ assignment })) }"
            else
              if @cleanValue
                code = "\#{ $e($c(#{ assignment })) }"
              else
                code = "\#{ $e(#{ assignment }) }"

          # Code block with unescaped output, either with `!=` or escaped mode to false
          else if identifier is '!=' or (identifier is '=' and not @escapeHtml)
            if @preserve
              if @cleanValue
                code = "\#{ $p($c(#{ assignment })) }"
              else
                code = "\#{ $p(#{ assignment }) }"
            else
              if @cleanValue
                code = "\#{ $c(#{ assignment }) }"
              else
                code = "\#{ #{ assignment } }"

          @opener = @markText "#{ prefix }>#{ code }"
          @closer = @markText "</#{ tokens.tag }>"

        # A Haml tag that contains an inline text
        else if tokens.text
          @opener = @markText "#{ prefix }>#{ tokens.text }"
          @closer = @markText "</#{ tokens.tag }>"

        # A Haml tag that can get more child nodes
        else
          @opener = @markText prefix + '>'
          @closer = @markText "</#{ tokens.tag}>"

      # Create a self closing tag that depends on the format `<br>` or `<br/>`
      else
        tokens.tag = tokens.tag.replace /\/$/, ''
        prefix     = @buildHtmlTagPrefix(tokens)
        @opener    = @markText "#{ prefix }#{ if @format is 'xhtml' then ' /' else '' }>"

  # Parses the expression and detect the tag, attributes
  # and any assignment. In addition class and id cleanup
  # is performed according the the Haml spec:
  #
  # * Classes are merged together
  # * When multiple ids are provided, the last one is taken,
  #   except they are defined in shortcut notation and attribute
  #   notation. In this case, they will be combined, separated by
  #   underscore.
  #
  # @example Id merging
  #   #user{ :id => @user.id }    =>  <div id='user_#{ @user.id }'></div>
  #
  # @param [String] exp the HAML expression
  # @return [Object] the parsed tag and options tokens
  #
  parseExpression: (exp) ->
    tag = @parseTag(exp)

    @preserve = true if @preserveTags.indexOf(tag.tag) isnt -1

    id         = @interpolateCodeAttribute(tag.ids?.pop(), true)
    classes    = tag.classes
    attributes = {}

    # Clean attributes
    if tag.attributes
      for key, value of tag.attributes
        if key is 'id'
          if id
            # Merge attribute id into existing id
            id += '_' + @interpolateCodeAttribute(value, true)
          else
            # Push id from attribute
            id = @interpolateCodeAttribute(value, true)

        # Merge classes
        else if key is 'class'
          classes or= []
          classes.push value

        # Add to normal attributes
        else
          attributes[key] = value

    {
      doctype    : tag.doctype
      tag        : tag.tag
      id         : id
      classes    : classes
      text       : escapeQuotes(tag.text)
      attributes : attributes
      assignment : tag.assignment
      reference  : tag.reference
    }

  # Parse a tag line. This recognizes DocType tags `!!!` and
  # HAML tags like `#id.class text`.
  #
  # It also parses the code assignment `=`, `}=` and `)=` or
  # inline text and the whitespace removal markers `<` and `>`.
  #
  # It detects an object reference `[` and attributes `(` / `{`.
  #
  # @param [String] exp the HAML expression
  # @return [Object] the parsed tag tokens
  #
  parseTag: (exp) ->
    try
      doctype = exp.match(/^(\!{3}.*)/)?[1]
      return { doctype: doctype } if doctype

      # Match the haml tag %a, .name, etc.
      haml = exp.match(/^((?:[#%\.][a-z0-9_:\-]*[\/]?)+)/i)[0]
      rest = exp.substring(haml.length)

      # The haml tag has attributes
      if rest.match /^[{([]/

        reference  = ''
        htmlAttributes = ''
        rubyAttributes = ''

        for start in ['[', '{', '(', '[', '{', '(']
          if start is rest[0]
            # Get used attribute surround end character
            end = switch start
                    when '{' then '}'
                    when '(' then ')'
                    when '[' then ']'

            # Extract attributes by keeping track of brace/parenthesis level
            level = 0
            for pos in [0..rest.length]
              ch = rest[pos]

              # Increase level when a nested brace/parenthesis is started
              level += 1 if ch is start

              # Decrease level when a nested brace/parenthesis is end or exit when on the last level
              if ch is end
                if level is 1 then break else level -= 1

            # Extract result
            switch start
              when '{'
                rubyAttributes += rest.substring(0, pos + 1)
                rest = rest.substring(pos + 1)
              when '('
                htmlAttributes += rest.substring(0, pos + 1)
                rest = rest.substring(pos + 1)
              when '['
                reference = rest.substring(1, pos)
                rest = rest.substring(pos + 1)

        assignment = rest || ''

      # No attributes defined
      else
        reference = ''
        htmlAttributes = ''
        rubyAttributes = ''
        assignment = rest

      # Merge HTML and Ruby style attributes
      attributes = {}
      for attr in [@parseAttributes(htmlAttributes), @parseAttributes(rubyAttributes)]
        attributes[key] = val for key, val of attr

      # Extract whitespace removal
      if whitespace = assignment.match(/^[<>]{0,2}/)?[0]
        assignment = assignment.substring(whitespace.length)

      # Remove the delimiter space from the assignment
      assignment = assignment.substring(1) if assignment[0] is ' '

      # Process inline text or assignment
      if assignment and not assignment.match(/^(=|!=|&=|~)/)
        text       = assignment.replace(/^ /, '')
        assignment = undefined

      # Set whitespace removal markers
      if whitespace
        @wsRemoval.around = true if whitespace.indexOf('>') isnt -1

        if whitespace.indexOf('<') isnt -1
          @wsRemoval.inside = true
          @preserve = true

      # Extracts tag name, id and classes
      tag     = haml.match(/\%([a-z_\-][a-z0-9_:\-]*[\/]?)/i)
      ids     = haml.match(/\#([a-z_\-][a-z0-9_\-]*)/gi)
      classes = haml.match(/\.([a-z0-9_\-]*)/gi)

      {
        tag        : if tag then tag[1] else 'div'
        ids        : ("'#{ id.substr(1) }'" for id    in ids)     if ids
        classes    : ("'#{ klass.substr(1) }'" for klass in classes) if classes
        attributes : attributes
        assignment : assignment
        reference  : reference
        text       : text
      }

    catch error
      throw new Error("Unable to parse tag from #{ exp }: #{ error }")

  # Parse attributes either in Ruby style `%tag{ :attr => 'value' }`
  # or HTML style `%tag(attr='value)`. Both styles can be mixed:
  # `%tag(attr='value){ :attr => 'value' }`.
  #
  # This takes also care of proper attribute interpolation, unwrapping
  # quoted keys and value, e.g. `'a' => 'hello'` becomes `a => hello`.
  #
  # @param [String] exp the HAML expression
  # @return [Object] the parsed attributes
  #
  parseAttributes: (exp) ->
    attributes = {}
    return attributes if exp is undefined

    type = exp.substring(0, 1)

    # Mark key separator characters within quoted values, so they aren't recognized as keys.
    exp = exp.replace /(=|:|=>)\s*('([^\\']|\\\\|\\')*'|"([^\\"]|\\\\|\\")*")/g, (match, type, value) ->
      type + value?.replace /(:|=|=>)/g, '\u0090$1'

    # Mark key separator characters within parenthesis, so they aren't recognized as keys.
    level = 0
    start = 0
    markers = []

    if type is '('
      startPos = 1
      endPos = exp.length - 1
    else
      startPos = 0
      endPos = exp.length

    for pos in [startPos...endPos]
      ch = exp[pos]

      # Increase level when a parenthesis is started
      if ch is '('
        level += 1
        start = pos if level is 1

      # Decrease level when a parenthesis is end
      if ch is ')'
        if level is 1
          markers.push({ start: start, end: pos }) if start isnt 0 and pos - start isnt 1
        else
          level -= 1

    for marker in markers.reverse()
      exp = exp.substring(0, marker.start) + exp.substring(marker.start, marker.end).replace(/(:|=|=>)/g, '\u0090$1') + exp.substring(marker.end)

    # Detect the used key type
    switch type
      when '('
        # HTML attribute keys
        keys = ///
               \(\s*([-\w]+[\w:-]*\w?)\s*=
               |
               \s+([-\w]+[\w:-]*\w?)\s*=
               |
               \(\s*('\w+[\w:-]*\w?')\s*=
               |
               \s+('\w+[\w:-]*\w?')\s*=
               |
               \(\s*("\w+[\w:-]*\w?")\s*=
               |
               \s+("\w+[\w:-]*\w?")\s*=
               ///g

      when '{'
        # Ruby attribute keys
        keys = ///
               [{,]\s*(\w+[\w:-]*\w?)\s*:
               |
               [{,]\s*('[-\w]+[\w:-]*\w?')\s*:
               |
               [{,]\s*("[-\w]+[\w:-]*\w?")\s*:
               |
               [{,]\s*:(\w+[\w:-]*\w?)\s*=>
               |
               [{,]\s*:?'([-\w]+[\w:-]*\w?)'\s*=>
               |
               [{,]\s*:?"([-\w]+[\w:-]*\w?)"\s*=>
               ///g

    # Split into key value pairs
    pairs = exp.split(keys).filter(Boolean)

    inDataAttribute = false
    hasDataAttribute = false

    # Process the pairs in a group of two
    while pairs.length
      keyValue = pairs.splice 0, 2

      # Just a single attribute without value
      if keyValue.length is 1
        attr = keyValue[0].replace(/^[\s({]+|[\s)}]+$/g, '')
        attributes[attr] = 'true'

      # Attribute with value or multiple attributes
      else
        # Trim key and remove preceding colon and remove markers
        key = keyValue[0]?.replace(/^\s+|\s+$/g, '').replace(/^:/, '')
        key = quoted[2] if quoted = key.match /^("|')(.*)\1$/

        # Trim value, remove succeeding comma and remove markers
        value = keyValue[1]?.replace(/^\s+|[\s,]+$/g, '').replace(/\u0090/g, '')

        if key is 'data' and !value
          inDataAttribute = true
          hasDataAttribute = true

        else if key and value
          if inDataAttribute
            key = if @hyphenateDataAttrs then "data-#{ key.replace('_', '-') }" else "data-#{ key }"
            inDataAttribute = false if /}\s*$/.test value

        switch type
          when '('
            value = value.replace(/^\s+|[\s)]+$/g, '')

            # Detect attributes without value as value suffix
            quote = /^(['"])/.exec(value)?[1]
            pos = value.lastIndexOf quote

            if pos > 1
              for attr in value.substring(pos + 1).split ' '
                attributes[attr] = 'true' if attr

              value = value.substring(0, pos + 1)


            attributes[key] = value
          when '{'
            attributes[key] = value.replace(/^\s+|[\s}]+$/g, '')

    delete attributes['data'] if hasDataAttribute

    attributes

  # Build the HTML tag prefix by concatenating all the
  # tag information together. The result is an unfinished
  # html tag that must be further processed:
  #
  # @example Prefix tag
  #   <a id='id' class='class' attr='value'
  #
  # The Haml spec sorts the `class` names, even when they
  # contain interpolated classes. This is supported by
  # sorting classes at template render time.
  #
  # If both an object reference and an id or class attribute is defined,
  # then the attribute will be ignored.
  #
  # @example Template render time sorting
  #   <p class='#{ [@user.name(), 'show'].sort().join(' ') }'>
  #
  # @param [Object] tokens all parsed tag tokens
  # @return [String] the tag prefix
  #
  buildHtmlTagPrefix: (tokens) ->
    tagParts = ["<#{ tokens.tag }"]

    # Set tag classes
    if tokens.classes

      hasDynamicClass = false

      # Prepare static and dynamic class names
      classList = for name in tokens.classes
        name = @interpolateCodeAttribute(name, true)
        hasDynamicClass = true if name.indexOf('#{') isnt -1
        name

      # Render time classes
      if hasDynamicClass && classList.length > 1
        classes = '#{ ['
        classes += "#{ @quoteAndEscapeAttributeValue(klass, true) }," for klass in classList
        classes = classes.substring(0, classes.length - 1) + '].sort().join(\' \').replace(/^\\s+|\\s+$/g, \'\') }'

      # Compile time classes
      else
        classes = classList.sort().join ' '

      tagParts.push "class='#{ classes }'"

    # Set tag id
    tagParts.push "id='#{ tokens.id }'" if tokens.id

    # Add id from object reference
    if tokens.reference
      if tokens.attributes
        delete tokens.attributes['class']
        delete tokens.attributes['id']

      tagParts.push "\#{$r(" + tokens.reference + ")}"

    # Construct tag attributes
    if tokens.attributes
      for key, value of tokens.attributes

        # Boolean attribute logic
        if value is 'true' or value is 'false'

          # Only show true values
          if value is 'true'
            if @format is 'html5'
              tagParts.push "#{ key }"
            else
              tagParts.push "#{ key }=#{ @quoteAndEscapeAttributeValue(key) }"

        # Anything but booleans
        else
          tagParts.push "#{ key }=#{ @quoteAndEscapeAttributeValue(@interpolateCodeAttribute(value)) }"

    tagParts.join(' ')

  # Wrap plain attributes into an interpolation for execution.
  # In addition wrap it into escaping and cleaning function,
  # depending on the options.
  #
  # @param [String] text the possible code
  # @param [Boolean] unwrap unwrap static text from quotes
  # @return [String] the text of the wrapped code
  #
  interpolateCodeAttribute: (text, unwrap = false) ->
    return unless text

    if not text.match /^("|').*\1$/
      if @escapeAttributes
        if @cleanValue
          text = '#{ $e($c(' + text + ')) }'
        else
          text = '#{ $e(' + text + ') }'
      else
        if @cleanValue
          text = '#{ $c(' + text + ') }'
        else
          text = '#{ (' + text + ') }'

    if unwrap
      text = quoted[2] if quoted = text.match /^("|')(.*)\1$/

    text

  # Quote the attribute value, depending on its
  # content. If the attribute contains an interpolation,
  # each interpolation will be cleaned and/or escaped,
  # depending on the compiler options.
  #
  # @param [String] value the without start and end quote
  # @param [String] code if we are in a code block
  # @return [String] the quoted value
  #
  quoteAndEscapeAttributeValue: (value, code = false) ->
    return unless value

    value  = quoted[2] if quoted = value.match /^("|')(.*)\1$/
    tokens = @splitInterpolations value

    hasSingleQuotes = false
    hasDoubleQuotes = false
    hasInterpolation = false

    # Analyse existing quotes and escape/clean interpolations
    tokens = for token in tokens
      if token[0..1] is '#{'
        # Skip interpolated code attributes
        if token.indexOf('$e') is -1 and token.indexOf('$c') is -1
          if @escapeAttributes
            if @cleanValue
              token = '#{ $e($c(' + token[2...-1] + ')) }'
            else
              token = '#{ $e(' + token[2...-1] + ') }'
          else
            if @cleanValue
              token = '#{ $c(' + token[2...-1] + ') }'

        hasInterpolation = true
      else
        hasSingleQuotes = token.indexOf("'") isnt -1 unless hasSingleQuotes
        hasDoubleQuotes = token.indexOf('"') isnt -1 unless hasDoubleQuotes

      token

    if code
      if hasInterpolation
        result = "\"#{ tokens.join('') }\""
      else
        result = "'#{ tokens.join('') }'"

    else
      # Without any qoutes, wrap the value in single quotes
      if not hasDoubleQuotes and not hasSingleQuotes
        result = "'#{ tokens.join('') }'"

      # With only single quotes, wrap the value in double quotes
      if hasSingleQuotes and not hasDoubleQuotes
        result = "\\\"#{ tokens.join('') }\\\""

      # With only double quotes, wrap the value in single quotes and escape the double quotes
      if hasDoubleQuotes and not hasSingleQuotes
        escaped = for token in tokens
          escapeQuotes(token)
        result = "'#{ escaped.join('') }'"

      # With both type of quotes, wrap the value in single quotes, escape the double quotes and
      # convert the single quotes to it's entity representation
      if hasSingleQuotes and hasDoubleQuotes
        escaped = for token in tokens
          escapeQuotes(token).replace(/'/g, '&#39;')
        result = "'#{ escaped.join('') }'"

    result

  # Split expression by its interpolations.
  #
  # @example
  #   'Hello #{ "#{ soso({}) }" } Interpol') => ["Hello ", "#{ "#{ soso({}) }" }", " Interpol"]
  #   'Hello #{ "#{ soso }" } Interpol') => ["Hello ", "#{ "#{ soso }" }", " Interpol"]
  #   'Hello #{ int } Interpol') => ["Hello ", "#{ int }", " Interpol"]
  #   'Hello Interpol') => ["Hello Interpol"]
  #   '#{ int } Interpol') => ["#{ int }", " Interpol"]
  #   'Hello #{ int }') => ["Hello ", "#{ int }"]
  #   '#{ int }') => ["#{ int }"]
  #
  # @param [String] value the attribute value
  # @return [Array<String>] the splitted string
  #
  splitInterpolations: (value) ->
    level = 0
    start = 0
    tokens = []

    for pos in [0...value.length]
      ch  = value[pos]
      ch2 = value[pos..pos + 1]

      if ch is '{'
        level += 1

      if ch2 is '#{' and level is 0
        tokens.push(value[start...pos])
        start = pos

      if ch is '}'
        level -= 1

        if level is 0
          tokens.push(value[start..pos])
          start = pos + 1

    tokens.push(value[start...value.length])

    tokens.filter(Boolean)

  # Build the DocType string depending on the `!!!` token
  # and the currently used HTML format.
  #
  # @param [String] doctype the HAML doctype
  # @return [String] the HTML doctype
  #
  buildDocType: (doctype) ->
    switch "#{ @format } #{ doctype }"
      when 'xhtml !!! XML' then '<?xml version=\'1.0\' encoding=\'utf-8\' ?>'
      when 'xhtml !!!' then '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">'
      when 'xhtml !!! 1.1' then '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">'
      when 'xhtml !!! mobile' then '<!DOCTYPE html PUBLIC "-//WAPFORUM//DTD XHTML Mobile 1.2//EN" "http://www.openmobilealliance.org/tech/DTD/xhtml-mobile12.dtd">'
      when 'xhtml !!! basic' then '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML Basic 1.1//EN" "http://www.w3.org/TR/xhtml-basic/xhtml-basic11.dtd">'
      when 'xhtml !!! frameset' then '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Frameset//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-frameset.dtd">'
      when 'xhtml !!! 5', 'html5 !!!' then '<!DOCTYPE html>'
      when 'html5 !!! XML', 'html4 !!! XML' then ''
      when 'html4 !!!' then '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">'
      when 'html4 !!! frameset' then '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Frameset//EN" "http://www.w3.org/TR/html4/frameset.dtd">'
      when 'html4 !!! strict' then '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">'

  # Test if the given tag is a non-self enclosing tag, by
  # matching against a fixed tag list or parse for the self
  # closing slash `/` at the end.
  #
  # @param [String] tag the tag name without brackets
  # @return [Boolean] true when a non self closing tag
  #
  isNotSelfClosing: (tag) ->
    @selfCloseTags.indexOf(tag) == -1 && !tag.match(/\/$/)
