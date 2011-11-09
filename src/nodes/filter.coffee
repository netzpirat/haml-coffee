Node = require('./node')
e    = require('../helper').escapeHTML

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
    if @parentNode instanceof Filter
      @filter = @parentNode.filter
      @content = @expression

    # Top level filter expression
    else
      @filter = @expression.match(/:(escaped|preserve|css|javascript|coffeescript|plain)(.*)?/)[1]

  # Render the filter
  #
  render: ->
    @evaluateIfNecessary()
    output = ''

    # Nested filter content
    if @parentNode instanceof Filter
      output = @content

    # Top level filter expression
    else

      switch @filter
        when 'escaped'
          for child in @children
            output += @outputHtml(e(child.render()))

        when 'preserve'
          output += "#{ child.render() }&#x000A;" for child in @children
          output = output.replace(/\&\#x000A;$/, '')
          output = @outputHtml(output)

        when 'plain'
          output += child.render() for child in @children
          output = @outputHtml(output)

        when 'css'
          output += @outputHtml('<style type=\'text/css\'>')
          output += @outputHtml('  /*<![CDATA[*/')

          for child in @children
            css = child.render()
            output += @outputHtml("    #{ css }") unless css is '' && child is @children[@children.length - 1]

          output += @outputHtml('  /*]]>*/')
          output += @outputHtml('</style>')

        when 'javascript'
          output += @outputHtml('<script type=\'text/javascript\'>')
          output += @outputHtml('  //<![CDATA[')

          for child in @children
            js = child.render()
            output += @outputHtml("    #{ js }") unless js is '' && child is @children[@children.length - 1]

          output += @outputHtml('  //]]>')
          output += @outputHtml('</script>')

        when 'cdata'
          output += @outputHtml('/*<![CDATA[*/')

          for child in @children
            cdata = child.render()
            output += @outputHtml("  #{ cdata }") unless cdata is '' && child is @children[@children.length - 1]

          output += @outputHtml('/*]]>*/')

        when 'coffeescript'
          output += child.render() for child in @children
          output = @opener + '#{' + output + '}' + @closer

    output

  # Traverse up the tree until it finds the
  # top level filter expression node.
  #
  # @return [Node] the top level filter node
  #
  getFilterExpressionNode: ->
    if @parentNode instanceof Filter
      @parentNode.getFilterExpressionNode()
    else
      @
