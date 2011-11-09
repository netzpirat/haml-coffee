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
    codeBlock  = @expression.match(/(-|!=|\&=|=|~)\s?(.*)?/)
    @identifier = codeBlock[1]
    @code       = codeBlock[2]

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
      output += "#{ @cw }#{ @code }\n"

    # Code block that preserves whitespace
    else if @identifier is '~'
      output += "#{ @cw }o.push \"#{ @hw }\#{#{ @findAndPreserve(@code) }}\"\n"

    # Code block with escaped code block, either `=` in escaped mode or `&=`
    else if @identifier is '&=' or (@identifier is '=' and @escapeHtml)
      output += "#{ @cw }o.push e \"#{ @hw }\#{#{ @code }}\"\n"

    # Code block with unescaped output, either with `!=` or escaped mode to false
    else
      output += "#{ @cw }o.push \"#{ @hw }\#{#{ @code }}\"\n"

    output

  # Find and preserve newlines within the preserve tags
  #
  # @param [String] code the code to preserve
  # @return [String] the preserved code
  #
  findAndPreserve: (code) ->
    code.replace /<(pre|textarea)>(.*?)<\/\1>/g, (text) ->
      text.replace('\\n', '\&\#x000A;')
