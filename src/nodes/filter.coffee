Node = require('./node')

{whitespace}    = require('../util/text')
{unescapeQuotes} = require('../util/text')

# Filter node for built-in Haml filters:
#
# * `:escaped`
# * `:preserve`
# * `:plain`
# * `:css`
# * `:javascript`
# * `:cdata`
#
# Only the top level filter marker is a filter node, containing
# child nodes are text nodes.
#
module.exports = class Filter extends Node

  # Evaluate the Haml filters
  #
  evaluate: ->
    @filter = @expression.match(/:(escaped|preserve|css|javascript|coffeescript|plain|cdata|coffeescript)(.*)?/)?[1]

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
        @renderFilterContent(0, output)

      when 'css'
        if @format is 'html5'
          output.push @markText('<style>')
        else
          output.push @markText('<style type=\'text/css\'>')

        output.push @markText('  /*<![CDATA[*/') if @format is 'xhtml'

        indent = if @format is 'xhtml' then 2 else 1
        @renderFilterContent(indent, output)

        output.push @markText('  /*]]>*/') if @format is 'xhtml'
        output.push @markText('</style>')

      when 'javascript'
        if @format is 'html5'
          output.push @markText('<script>')
        else
          output.push @markText('<script type=\'text/javascript\'>')

        output.push @markText('  //<![CDATA[') if @format is 'xhtml'

        indent = if @format is 'xhtml' then 2 else 1
        @renderFilterContent(indent, output)

        output.push @markText('  //]]>') if @format is 'xhtml'
        output.push @markText('</script>')

      when 'cdata'
        output.push @markText('<![CDATA[')
        @renderFilterContent(2, output)
        output.push @markText(']]>')

      when 'coffeescript'
        @renderFilterContent(0, output, 'run')

    output

  # Render the child content, but omits empty lines at the end
  #
  # @param [Array] output where to append the content
  # @param [Number] indent the content indention
  #
  renderFilterContent: (indent, output, type = 'text') ->
    content = []
    empty   = 0

    content.push(child.render()[0].text) for child in @children

    for line in content
      if line is ''
        empty += 1
      else
        switch type
          when 'text'
            output.push @markText("") for e in [0...empty]
            output.push @markText("#{ whitespace(indent) }#{ line }")
          when 'run'
            output.push @markRunningCode("#{ unescapeQuotes(line) }")

        empty = 0
