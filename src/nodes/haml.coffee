Node  = require('./node')
eq    = require('../helper').escapeQuotes

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

  @selfCloseTags: ['meta', 'img', 'link', 'br', 'hr', 'input', 'area', 'param', 'col', 'base']
  @preserveTags:  ['pre', 'textarea']

  # Evaluate the node content and store the opener tag
  # and the closer tag if applicable.
  #
  evaluate: ->
    tokens = @parseExpression(@expression)

    # Evaluate Haml doctype
    if tokens.doctype
      @opener = @markText "#{ eq(@buildDocType(tokens.doctype)) }"

    # Evaluate Haml tag
    else
      # Create a Haml node that can contain child nodes
      if @isNotSelfClosing(tokens.tag)

        prefix = eq(@buildHtmlTagPrefix(tokens))

        # Add Haml tag that contains a code assignment will be closed immediately
        if tokens.assignment
          code    = if @escapeHtml then "\#{e #{ tokens.assignment }}" else "\#{#{ tokens.assignment }}"
          @opener = @markText "#{prefix }>#{ code }"
          @closer = @markText "</#{ tokens.tag }>"

        # A Haml tag that contains an inline text
        else if tokens.text
          @opener = @markText "#{prefix }>#{ tokens.text }"
          @closer = @markText "</#{ tokens.tag }>"

        # A Haml tag that can get more child nodes
        else
          @opener = @markText prefix + '>'
          @closer = @markText "</#{ tokens.tag}>"

      # Create a self closing tag that depends on the format `<br>` or `<br/>`
      else
        tokens.tag = tokens.tag.replace /\/$/, ''
        prefix     = eq(@buildHtmlTagPrefix(tokens))
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
    tag     = @parseTag(exp)
    options = @parseOptions(exp)

    @preserve = true if Haml.preserveTags.indexOf(tag.tag) isnt -1

    pairs   = []
    id      = tag.ids?.pop()
    classes = tag.classes

    # Clean attributes
    for pair in options.pairs
      if pair.key is 'id'
        if id
          # Merge attribute id into existing id
          id += '_' + pair.value
        else
          # Push id from attribute
          id = pair.value

      # Merge classes
      else if pair.key is 'class'
        classes or= []
        classes.push pair.value

      # Add to normal attributes
      else
        pairs.push pair

    {
      doctype    : tag.doctype
      tag        : tag.tag
      id         : id
      classes    : classes
      text       : tag.text
      pairs      : pairs
      assignment : options.assignment
    }

  # Parse a tag line. This recognizes DocType tags `!!!` and
  # HAML tags like `#id.class text`.
  #
  # @param [String] exp the HAML expression
  # @return [Object] the parsed tag tokens
  #
  parseTag: (exp) ->
    try
      doctype = exp.match(/^(\!{3}.*)/)?[1]
      return { doctype: doctype } if doctype

      # Separate Haml tags and inline text
      tokens = exp.match /^((?:[#%\.][a-z0-9_:\-]*[\/]?)+)(?:[\(\{].*[\)\}])?([\<\>]{0,2})(.*)?$/i
      haml   = tokens[1]
      text   = tokens[3].replace(/^ /, '') if tokens[3] && !tokens[3].match(/^=/)

      # Set whitespace removal markers
      if tokens[2]
        @wsRemoval.around = true if tokens[2].indexOf('>') isnt -1

        if tokens[2].indexOf('<') isnt -1
          @wsRemoval.inside = true
          @preserve = true

      # Extracts tag name, id and classes
      tag     = haml.match(/\%([a-z_\-][a-z0-9_:\-]*[\/]?)/i)
      ids     = haml.match(/\#([a-z_\-][a-z0-9_\-]*)/gi)
      classes = haml.match(/\.([a-z0-9_\-]*)/gi)

      {
        tag     : if tag then tag[1] else 'div'
        ids     : (id.substr(1)    for id    in ids)     if ids
        classes : (klass.substr(1) for klass in classes) if classes
        text    : text
      }

    catch error
      throw "Unable to parse tag from #{ exp }: #{ error }"

  # Parse the tag attributes and code assignment.
  #
  # @param [String] exp the HAML expression
  # @return [Object] the parsed option tokens
  #
  parseOptions: (exp) ->
    [pairs, hasAttributes] = @parseAttributes(exp)

    {
      pairs      : pairs
      assignment : @parseAssignment(exp, hasAttributes)
    }

  # Parse for code assignment `=`, `}=` and `)=`.
  # The parsed assignment contains only the code and no HAML
  # `)=` or `}=` tokens.
  #
  # @param [String] exp the HAML expression
  # @param [Boolean] hasAttributes if the expression contains attributes
  # @return [String] the parsed assignment
  #
  parseAssignment: (exp, hasAttributes) ->
    if hasAttributes
      assignment = exp.match /[\}\)]=\s*(\S+)$/
    else
      assignment = exp.match /\=\s*(\S+.*)$/

    console.log exp, assignment?[1]
    if assignment then assignment[1] else undefined

  # Parse attributes either in Ruby style `%tag{ :attr => 'value' }`
  # or HTML style `%tag(attr='value)`. Both styles can be mixed:
  # `%tag(attr='value){ :attr => 'value' }`.
  #
  # This takes also care of proper attribute interpolation, unwrapping
  # quoted keys and value, e.g. `'a' => 'hello'` becomes `a => hello`.
  #
  # @param [String] exp the HAML expression
  # @return [Object] the parsed attribute tokens
  #
  parseAttributes: (exp) ->
    pairs = []
    attributes = exp.match /([^:|\s|=]+\s*=>\s*(("[^"]+")|('[^']+')|[^\s,\}]+))|([\w:]+=(("[^"]+")|('[^']+')|[^\s\)]+))/g
    return [pairs, false] unless attributes

    for attribute in attributes
      pair  = attribute.split /\=>|\=/
      key   = pair[0].trim().replace /^:/, ''
      value = pair[1].trim()

      # Ignore attributes some attribute values
      if ['false', '"false"', "'false'", '', '""', "''"].indexOf(value) is -1

        # Set key to value if the value is boolean true
        if ['true', '"true"', "'true'"].indexOf(value) isnt -1
          value = "'#{ key }'"

        # Wrap plain attributes into an interpolation, expect boolean values
        else if not value.match /^("|').*\1$/
          if @escapeAttributes
            value = '\'#{ e(' + value + ') }\''
          else
            value = '\'#{ ' + value + ' }\''

        # Unwrap value from quotes
        value = quoted[2] if quoted = value.match /^("|')(.*)\1$/

        # Unwrap key from quotes
        key = quoted[2] if quoted = key.match /^("|')(.*)\1$/

        pairs.push {
          key   : key
          value : value
        }

    [pairs, true]

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
            classes += interpolation[1] + ','
          else
            classes += "'#{ klass }',"
        classes += '].sort().join(\' \') }'

      tagParts.push "class='#{ classes }'"

    # Set tag id
    tagParts.push "id='#{ tokens.id }'" if tokens.id

    # Construct tag attributes
    if tokens.pairs.length > 0
      for pair in tokens.pairs
        if pair.key isnt pair.value || @format isnt 'html5'
          tagParts.push "#{ pair.key }=#{ @quoteAttributeValue(pair.value) }"
        else
          tagParts.push "#{ pair.key }"

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
    Haml.selfCloseTags.indexOf(tag) == -1 && !tag.match(/\/$/)
