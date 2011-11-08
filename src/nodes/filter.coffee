Node       = require('./node')
escapeHTML = require('../helper').escapeHTML

# Filter node for built-in Haml filters:
#
# * :escaped
# * :preserve
# * :plain
# * :css
# * :javascript
# * :cdata
#
# In addition Haml Coffee provides:
#
# * :coffeescript
#
module.exports = class Filter extends Node

  # Evaluate the Haml filters
  #
  evaluate: ->

    # Nested filter content
    if @parent_node instanceof Filter
      @filter = @parent_node.filter
      @content = @expression

    # Top level filter expression
    else
      tokens = @expression.match(/:(escaped|preserve|css|javascript|coffeescript)(.*)?/)

      @filter = tokens[1]
      @content = tokens[2]

      switch @filter

        when 'escaped'
          @opener = escapeHTML(@content)
          @closer = ''

        when 'preserve', 'plain'
          @opener = ''
          @closer = ''

        when 'cdata'
          @opener = '/*<![CDATA[*/' + @content
          @closer = '/*]]>*/'

        when 'css'
          @opener = '<style type=\'text/css\'>\n  /*<![CDATA[*/' + @content
          @closer = '  /*]]>*/\n</script>'

        when 'javascript'
          @opener = '<script type=\'text/javascript\'>\n  /*<![CDATA[*/' + @content
          @closer = '  /*]]>*/\n</script>'

        when 'coffeescript'
          @opener = '<script type=\'text/javascript\'>\n  /*<![CDATA[*/#{' + @content + '}'
          @closer = '  /*]]>*/\n</script>'

  # Render the filter
  #
  render: ->
    @evaluateIfNecessary()
    output = ''

    # Nested filter content
    if @parent_node instanceof Filter
      output = @content

    # Top level filter expression
    else
      content = "#{ child.render() }" for child in @children

      switch @filter
        when 'escaped'
          output += escapeHTML(content)
        when 'preserve'
          output += content.replace("\n", '&#x000A;')
        when 'css', 'javascript', 'cdata', 'plain'
          output += content
        when 'coffeescript'
          output += '#{' + content + '}'

      output = "#{ @cw }o.push \"#{ @hw }#{ output }\"\n"

    output
