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
    code_block  = @expression.match(/(-|!=|\&=|=)\s?(.*)?/)
    @identifier = code_block[1]
    @code       = code_block[2]

  # Render the node and its children
  # to CoffeeScript code.
  #
  # @return [String] the code
  #
  render: ->
    @evaluateIfNecessary()
    output = ''

    # Code block without output
    if @identifier is '-'
      output += "#{@ cw }#{ @code }\n"

    # Code block with escaped code block, either `=` in escaped mode or `&=`
    else if @identifier is '&=' or (@identifier is '=' and @escape_html)
      output += "#{ @cw }o.push e \"#{ @hw }\#{#{ @code }}\"\n"

    # Code block with unescaped output, either with `!=` or escaped mode to false
    else
      output += "#{ @cw }o.push \"#{ @hw }\#{#{ @code }}\"\n"

    output
