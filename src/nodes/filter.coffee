Node = require('./node')

# Filter node for built-in Haml filters:
#
# * :escaped
# * :preserve
# * :plain
# * :css
# * :javascript
# * :cdata
#
module.exports = class Filter extends Node

  # Evaluate the Haml filters
  #
  evaluate: ->

    # Every child of a filter will be a filter of the same type
    if @parentNode instanceof Filter
      @filter = @parentNode.filter
      @content = @expression

    # Top level filter expression
    else
      @filter = @expression.match(/:(escaped|preserve|css|javascript|coffeescript|plain)(.*)?/)[1]

  # Render the filter
  #
  render: ->
    # Just return the content of filter child line
    return @content  if @parentNode instanceof Filter

    output = []

    switch @filter
      when 'escaped'
        output.push @markText(child.render(), true) for child in @children

      when 'preserve'
        preserve  = ''
        preserve += "#{ child.render() }&#x000A;" for child in @children
        preserve  = preserve.replace(/\&\#x000A;$/, '')

        output.push @markText(preserve)

      when 'plain'
        plain  = ''
        plain += child.render() for child in @children

        output.push @markText(plain)

      when 'css'
        output.push @markText('<style type=\'text/css\'>')
        output.push @markText('  /*<![CDATA[*/')

        for child in @children
          css = child.render()
          output.push @markText("    #{ css }") unless css is '' && child is @children[@children.length - 1]

        output.push @markText('  /*]]>*/')
        output.push @markText('</style>')

      when 'javascript'
        output.push @markText('<script type=\'text/javascript\'>')
        output.push @markText('  //<![CDATA[')

        for child in @children
          js = child.render()
          output.push @markText("    #{ js }") unless js is '' && child is @children[@children.length - 1]

        output.push @markText('  //]]>')
        output.push @markText('</script>')

      when 'cdata'
        output.push @markText('/*<![CDATA[*/')

        for child in @children
          cdata = child.render()
          output.push @markText("  #{ cdata }") unless cdata is '' && child is @children[@children.length - 1]

        output.push @markText('/*]]>*/')

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
