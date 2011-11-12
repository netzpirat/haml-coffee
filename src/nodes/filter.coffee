Node = require('./node')
w    = require('../helper').whitespace

# Filter node for built-in Haml filters:
#
# * :escaped
# * :preserve
# * :plain
# * :css
# * :javascript
# * :cdata
#
# Only the top level filter marker is a filter node, containing
# child nodes are text nodes.
#
module.exports = class Filter extends Node

  # Evaluate the Haml filters
  #
  evaluate: ->
    @filter = @expression.match(/:(escaped|preserve|css|javascript|coffeescript|plain)(.*)?/)?[1]

  # Render the filter
  #
  render: ->
    output = []

    switch @filter
      when 'escaped'
        output.push @markText(child.render()[0].text, true) for child in @children

      when 'preserve'
        preserve  = ''
        preserve += "#{ child.render()[0].text }&#x000A;" for child in @children
        preserve  = preserve.replace(/\&\#x000A;$/, '')

        output.push @markText(preserve)

      when 'plain'
        plain  = ''
        plain += child.render()[0].text for child in @children

        output.push @markText(plain)

      when 'css'
        output.push @markText('<style type=\'text/css\'>')
        output.push @markText('  /*<![CDATA[*/')
        @renderFilterContent(2, output)
        output.push @markText('  /*]]>*/')
        output.push @markText('</style>')

      when 'javascript'
        output.push @markText('<script type=\'text/javascript\'>')
        output.push @markText('  //<![CDATA[')
        @renderFilterContent(2, output)
        output.push @markText('  //]]>')
        output.push @markText('</script>')

      when 'cdata'
        output.push @markText('/*<![CDATA[*/')
        @renderFilterContent(1, output)
        output.push @markText('/*]]>*/')

      when 'coffeescript'
        output += child.render()[0].text for child in @children
        output = @opener + '#{' + output + '}' + @closer

    output

  # Render the child content, but omits empty lines at the end
  #
  # @param [Array] output where to append the content
  # @param [Number] indent the content indention
  #
  renderFilterContent: (indent, output) ->
    content = []
    empty   = 0

    content.push(child.render()[0].text) for child in @children

    for line in content
      if line is ''
        empty += 1
      else
        output.push @markText("") for e in [0...empty]
        empty = 0
        output.push @markText("#{ w(indent) }#{ line }")