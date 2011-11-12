Node  = require('./node')

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
    identifier = codeBlock[1]
    code       = codeBlock[2]

    # Code block without output
    if identifier is '-'
      @opener = @markRunningCode(code)

      # Suppress return value from function with Haml tags
      @closer = @markRunningCode("  ''") if @children.length isnt 0

    # Code block that preserves whitespace
    else if identifier is '~'
      @opener = @markInsertingCode(@findAndPreserve(code))

    # Code block with escaped code block, either `=` in escaped mode or `&=`
    else if identifier is '&=' or (identifier is '=' and @escapeHtml)
      @opener = @markInsertingCode(code, true)

    # Code block with unescaped output, either with `!=` or escaped mode to false
    else if identifier is '!=' or (identifier is '=' and not @escapeHtml)
      @opener = @markInsertingCode(code)

  # Find and preserve newlines within the preserve tags
  #
  # @param [String] code the code to preserve
  # @return [String] the preserved code
  #
  findAndPreserve: (code) ->
    code.replace /<(pre|textarea)>(.*?)<\/\1>/g, (text) ->
      text.replace('\\n', '\&\#x000A;')
