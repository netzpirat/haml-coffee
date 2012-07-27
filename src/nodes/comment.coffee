Node  = require('./node')
{escapeQuotes} = require('../util/text')

# Comment node for silent code blocks or pure
# Haml comments.
#
# @example silent code block
#   -# silent
#     code comment
#
# @example Haml comment
#   / This is a comment
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
        @opener = @markText ''

      # Conditional comment
      when '\/['
        @opener = @markText "<!--[#{ comment }>"
        @closer = @markText '<![endif]-->'

      # Normal Haml comment
      when '\/'

        # With a inline comment
        if comment
          @opener = @markText "<!-- #{ escapeQuotes(comment) }"
          @closer = @markText ' -->'

        # With multi line comment
        else
          @opener = @markText "<!--"
          @closer = @markText '-->'
