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
  escapeQuotes: (text) ->
    return '' unless text

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
      .replace(/\"/g, '&quot;')

  # Preserve newlines within the preserve tags
  #
  # @param [String] code the code to preserve
  # @return [String] the preserved code
  #
  preserve: (code) ->
    if code
      code.replace /<(pre|textarea)>(.*?)<\/\1>/g, (text) ->
        text.replace('\\n', '\&\#x000A;')