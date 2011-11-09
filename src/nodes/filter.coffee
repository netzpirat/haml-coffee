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
      @filter = @expression.match(/:(escaped|preserve|css|javascript|coffeescript|plain)(.*)?/)[1]

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

      switch @filter
        when 'escaped'
          for child in @children
            output += "#{ @cw }o.push \"#{ @hw }#{ escapeHTML(child.render()) }\"\n"

        when 'preserve'
          output += "#{ child.render() }&#x000A;" for child in @children
          output = output.replace(/\&\#x000A;$/, '')
          output = "#{ @cw }o.push \"#{ @hw }#{ output }\"\n"

        when 'plain'
          output += "#{ child.render() }" for child in @children
          output = "#{ @cw }o.push \"#{ output }\"\n"

        when 'css'
          output += "#{ @cw }o.push \"#{ @hw }<style type=\'text/css\'>\"\n"
          output += "#{ @cw }o.push \"#{ @hw }  /*<![CDATA[*/\"\n"

          for child in @children
            css = child.render()
            output += "#{ @cw }o.push \"#{ @hw }    #{ css }\"\n" unless css is '' && child is @children[@children.length - 1]

          output += "#{ @cw }o.push \"#{ @hw }  /*]]>*/\"\n"
          output += "#{ @cw }o.push \"#{ @hw }</style>\"\n"

        when 'javascript'
          output += "#{ @cw }o.push \"#{ @hw }<script type=\'text/javascript\'>\"\n"
          output += "#{ @cw }o.push \"#{ @hw }  //<![CDATA[\"\n"

          for child in @children
            js = child.render()
            output += "#{ @cw }o.push \"#{ @hw }    #{ js }\"\n" unless js is '' && child is @children[@children.length - 1]

          output += "#{ @cw }o.push \"#{ @hw }  //]]>\"\n"
          output += "#{ @cw }o.push \"#{ @hw }</script>\"\n"

        when 'cdata'
          output += "#{ @cw }o.push \"#{ @hw }/*<![CDATA[*/\"\n"

          for child in @children
            cdata = child.render()
            output += "#{ @cw }o.push \"#{ @hw }  #{ cdata }\"\n" unless cdata is '' && child is @children[@children.length - 1]

          output += "#{ @cw }o.push \"#{ @hw }/*]]>*/\"\n"

        when 'coffeescript'
          output += "#{ child.render() }" for child in @children
          output = @opener + '#{' + output + '}' + @closer

    output

  # Traverse up the tree until it finds the
  # top level filter expression node.
  #
  # @return [Node] the top level filter node
  #
  getFilterExpressionNode: ->
    if @parent_node instanceof Filter
      @parent_node.getFilterExpressionNode()
    else
      @
