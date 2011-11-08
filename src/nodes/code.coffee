Node  = require('./node')
e     = require('../helper').escape

# Code node that represent lines of CoffeeScript code
# in the Haml template.
#
# @example inline code
#   - for project in projects
#
# @example Escaped code assignment
#   = user.get('email')
#
# @example Unescaped code assignment
#   != user.get('email')
#
module.exports = class Code extends Node

  # Evaluate the Haml inline code
  #
  evaluate: ->
    [expression, identifier, code] = @expression.match(/(-|!=|=)\s?(.*)?/)

    @opener =

      # Code block without output
      if identifier == '-'
        "#{@cw}#{ code }"

      # Code block with unescaped output
      else if identifier == '!=' or not @escape_html
        "#{@cw}o.push \"#{@hw}\#{#{ code }}\""

      # Code block with escaped code block
      else
        "#{@cw}o.push e \"#{@hw}\#{#{ code }}\""
