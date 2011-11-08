Node  = require('./node')

# Comment node for silent code blocks or pure
# Haml comments.
#
# @example silent code block
#   -# silent
#      code comment
#
# @example Haml comment
#   / comment
#
# @example Haml conditional comment
#   /[if IE]
#
# Comments nodes can be silent, so they swallow all the children output.
#
module.exports = class Comment extends Node

  # Evaluate the Haml comments
  #
  evaluate: ->
    [expression, identifier, comment] = @expression.match(/(-#|\/\[|\/)\s?(.*)?/)

    switch identifier

      # Silent code block
      when '-#'
        @silent = true
        @opener = ''

      # Conditional comment
      when '\/['
        @opener = "<!--[#{ comment }>"
        @closer = '<![endif]-->'

      # Normal Haml comment
      when '\/'

        # With a inline comment
        if comment
          @opener = "<!-- #{ comment }"
          @closer = ' -->'

        # With multi line comment
        else
          @opener = "<!--"
          @closer = '-->'
