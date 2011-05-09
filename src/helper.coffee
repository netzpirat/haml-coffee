module.exports =
  # whitespace helper function
  whitespace: (n) ->
    n = n * 2
    a = []
    while a.length < n
      a.push ' '
    a.join ''

  # escape quotation
  escape: (s) ->
    s.replace(/"/g, '\\"')