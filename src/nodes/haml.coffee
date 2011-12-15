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

        prefix = escapeQuotes(@buildHtmlTagPrefix(tokens))

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
        prefix     = escapeQuotes(@buildHtmlTagPrefix(tokens))
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

    id         = tag.ids?.pop()
    classes    = tag.classes
    attributes = []

    # Clean attributes
    if tag.attributes
      for attribute in tag.attributes
        if attribute.key is 'id'
          if id
            # Merge attribute id into existing id
            id += '_' + attribute.value
          else
            # Push id from attribute
            id = attribute.value

        # Merge classes
        else if attribute.key is 'class'
          classes or= []
          classes.push attribute.value

        # Add to normal attributes
        else
          attributes.push attribute

    {
      doctype    : tag.doctype
      tag        : tag.tag
      id         : id
      classes    : classes
      text       : tag.text
      attributes : attributes
      assignment : tag.assignment
    }

  # Parse a tag line. This recognizes DocType tags `!!!` and
  # HAML tags like `#id.class text`.
  #
  # It also parses the code assignment `=`, `}=` and `)=` or
  # inline text and the whitespace removal markers `<` and `>`.
  #
  # @param [String] exp the HAML expression
  # @return [Object] the parsed tag tokens
  #
  parseTag: (exp) ->
    try
      doctype = exp.match(/^(\!{3}.*)/)?[1]
      return { doctype: doctype } if doctype

      # Separate Haml tags and inline text
      tokens     = exp.match /^((?:[#%\.][a-z0-9_:\-]*[\/]?)+)(?:([\(\{].*[\)\}])?([\<\>]{0,2})(?=[=&!~])(.*)?|([\(\{].*[\)\}])?([\<\>]{0,2}))(.*)?/i
      haml       = tokens[1]
      attributes = tokens[2] || tokens[5]
      whitespace = tokens[3] || tokens[6]
      assignment = tokens[4] || tokens[7]

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
        ids        : (id.substr(1)    for id    in ids)     if ids
        classes    : (klass.substr(1) for klass in classes) if classes
        attributes : @parseAttributes(attributes)
        assignment : assignment
        text       : text
      }

    catch error
      throw "Unable to parse tag from #{ exp }: #{ error }"

  # Parse attributes either in Ruby style `%tag{ :attr => 'value' }`
  # or HTML style `%tag(attr='value)`. Both styles can be mixed:
  # `%tag(attr='value){ :attr => 'value' }`.
  #
  # This takes also care of proper attribute interpolation, unwrapping
  # quoted keys and value, e.g. `'a' => 'hello'` becomes `a => hello`.
  #
  # @param [String] exp the HAML expression
  # @return [Array] the parsed attribute tokens
  #
  parseAttributes: (exp) ->
    attributes = []
    return attributes if exp is undefined

    [exp, datas] = @getDataAttributes(exp)

    findAttributes = /// (?:
        # HTML attributes
        (\w+[\w:-]*\w?|'\w+[\w:-]*\w?'|"\w+[\w:-]*\w?")\s*=\s*("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[\w@.]+)
        # Ruby 1.8 attributes
      | (:\w+[\w:-]*\w?|'\w+[\w:-]*\w?'|"\w+[\w:-]*\w?")\s*=>\s*("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[-\w@.()\[\]'"]+)
        # Ruby 1.9 attributes
      | (\w+[\w:-]*\w?|'\w+[\w:-]*\w?'|"\w+[\w:-]*\w?"):\s*("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[-\w@.()\[\]'"]+)
      ) ///g

    # Prepare all attributes
    while match = findAttributes.exec(exp)
      key   = (match[1] || match[3] || match[5]).replace /^:/, ''
      value = match[2] || match[4] || match[6]
      bool  = false

      # Ignore attributes some attribute values
      if ['false', ''].indexOf(value) is -1

        # Set key to value if the value is boolean true
        if ['true'].indexOf(value) isnt -1
          value = "'#{ key }'"
          bool  = true

        # Wrap plain attributes into an interpolation, expect boolean values
        else if not value.match /^("|').*\1$/
          if @escapeAttributes
            if @cleanValue
              value = '\'#{ $e($c(' + value + ')) }\''
            else
              value = '\'#{ $e(' + value + ') }\''
          else
            if @cleanValue
              value = '\'#{ $c(' + value + ') }\''
            else
              value = '\'#{ (' + value + ') }\''

        # Unwrap value from quotes
        value = quoted[2] if quoted = value.match /^("|')(.*)\1$/

        # Unwrap key from quotes
        key = quoted[2] if quoted = key.match /^("|')(.*)\1$/

        attributes.push {
          key   : key
          value : value
          bool  : bool
        }

    attributes.concat(datas)

  # Extracts the data attributes.
  #
  # @example data attribute
  #
  # `:data => { :test => '123' }`
  #
  # @param [String] exp the expression to check
  # @return [Array<String, Array>] the expressions and data attributes
  #
  getDataAttributes: (exp) ->
    data = (/:?data:?\s*(?:=>\s*)?\{([^}]*)\},?/gi).exec(exp)
    return [exp, []] unless data?[1]

    exp = exp.replace(data[0], '')
    attributes = @parseAttributes(data[1])

    for attribute in attributes
      attribute.key = "data-#{ attribute.key }"

    [exp, attributes]

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
      classes = tokens.classes.sort().join ' '

      # Class sort when the JST template is rendered
      if tokens.classes.length > 1 && classes.match /#\{/
        classes = '#{ ['
        for klass in tokens.classes
          if interpolation = klass.match /#{(.*)}/
            classes += "(#{ interpolation[1] }),"
          else
            classes += "'#{ klass }',"
        classes += '].sort().join(\' \') }'

      tagParts.push "class='#{ classes }'"

    # Set tag id
    tagParts.push "id='#{ tokens.id }'" if tokens.id

    # Construct tag attributes
    if tokens.attributes
      for attribute in tokens.attributes
        if attribute.bool and @format is 'html5'
          tagParts.push "#{ attribute.key }"
        else
          tagParts.push "#{ attribute.key }=#{ @quoteAttributeValue(attribute.value) }"

    tagParts.join(' ')

  # Quote the attribute value, depending on its
  # content.
  #
  # @param [String] value the without start and end quote
  # @return [String] the quoted value
  #
  quoteAttributeValue: (value) ->
    if value.indexOf("'") is -1
      quoted = "'#{ value }'"
    else
      quoted = "\"#{ value }\""

    quoted

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
