Node  = require('./node')
qe     = require('../helper').escape

# static variables

# Html Node
module.exports = class Haml extends Node
  @selfCloseTags: ["meta", "img", "link", "br", "hr", "input", "area", "base"]
  
  constructor: (expression, block_level, code_block_level, @escape_html) ->
    super expression, block_level, code_block_level
  
  evaluate: ->
    parsedExpression = @parseExpression(@expression)
    htmlTagPrefix    = @buildHtmlTag(parsedExpression)

    if @isSelfClosing(parsedExpression.tag)
      @opener = "#{@cw}o.push \"#{@hw}#{qe(htmlTagPrefix)}>" 
      @closer = "#{@cw}o.push \"#{@hw}</#{parsedExpression.tag}>\""
    else
      @opener = "#{@cw}o.push \"#{@hw}#{qe(htmlTagPrefix)} />"

    if parsedExpression.assignment
      @opener +=
        if @escape_html
          "\#{e #{parsedExpression.assignment}}"
        else
          "\#{#{parsedExpression.assignment}}"
        
    @opener += '"'

  parseExpression: (exp) ->
    tagProperties    = @parseTag(exp)
    optionProperties = @parseOptions(exp)

    return (
      tag:        tagProperties.tag
      ids:        tagProperties.ids
      classes:    tagProperties.classes
      pairs:      optionProperties.pairs
      assignment: optionProperties.assignment)
  
  buildHtmlTag: (parsedExpression) ->
    tagParts = ["<#{parsedExpression.tag}"]

    if parsedExpression.ids
      tagParts.push "id=\"#{parsedExpression.ids.join(' ')}\""
    if parsedExpression.classes
      tagParts.push "class=\"#{parsedExpression.classes.join(' ')}\""
    if parsedExpression.pairs.length > 0
      (tagParts.push "#{pair.key}=#{pair.value}" for pair in parsedExpression.pairs)
    return tagParts.join(' ')
  
  parseTag: (exp) ->
    try
      tagExp = exp.match(/^((?:[.#%][a-z_\-][a-z0-9_:\-]*)+)(.*)$/i)[1]      
      tag     = tagExp.match(/\%([a-z_\-][a-z0-9_:\-]*)/i)
      tag     = if tag then tag[1] else 'div'
      ids     = tagExp.match(/\#([a-z_\-][a-z0-9_\-]*)/gi )
      classes = tagExp.match(/\.([a-z_\-][a-z0-9_\-]*)/gi )
      return(
        tag    : tag
        ids    : (id.substr(1)    for id    in ids)     if ids
        classes: (klass.substr(1) for klass in classes) if classes)
    catch error
      throw "Unable to parse tag from #{exp}: #{error}"
  
  parseOptions: (exp) ->
    optionsExp = exp.match /[\{\s=].*/i
    if optionsExp
      optionsExp = optionsExp[0]
      if optionsExp[0] == "{"
        attributesExp = optionsExp.match /\{(.*)\}/
        attributesExp = attributesExp[1] if attributesExp
        assignment = optionsExp.match /\{.*\}\s*=\s*(.*)/
      else
        assignment = optionsExp.match /\.*=\s*(.*)/
      assignment = assignment[1] if assignment
      pairs = @parseAttributes(attributesExp)
    return(
      assignment: assignment
      pairs     : pairs || []
    )
    
  parseAttributes: (attributesExp) ->
    pairs = []
    return pairs unless attributesExp?
    attributes = attributesExp.match(/(:[^\s|=]+\s*=>\s*(("[^"]+")|('[^']+')|[^\s]+))/g)
    for attribute in attributes
      pair   = attribute.split('=>')
      key    = pair[0].trim().substr(1)
      result = key.match(/^'(.+)'$/)
      key    = result[1] if result
      value  = pair[1].trim()
      valueIsLiteral = value.match(/("|')/)
      pairs.push
        key: key
        value: if valueIsLiteral then value else '"#{' + value + '}"'
    return pairs

  isSelfClosing: (tag) ->
    Haml.selfCloseTags.indexOf(tag) == -1
  
