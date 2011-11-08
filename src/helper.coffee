# Global helpers
#
module.exports =

  # whitespace helper function
  # @param [Number] n the number if indents
  # @return [String] the indention string
  #
  whitespace: (n) ->
    n = n * 2
    a = []
    while a.length < n
      a.push ' '
    a.join ''

  # Escape quotation in a text.
  #
  # @param [String] text the text containing quotes
  # @return [String] the escaped text
  #
  escape: (text) ->
    text.replace(/"/g, '\\"')

  # HTML Escape a text.
  #
  # @param [String] text the text
  # @return [String] the HTML escaped text
  #
  escapeHTML: (text) ->
    return '' unless text

    text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\'/g, '&apos;')
      .replace(/\"/g, '&quot;')
