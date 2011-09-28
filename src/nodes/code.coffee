Node  = require('./node')
e     = require('../helper').escape

# Code Node
module.exports = class Code extends Node
  constructor: (expression, block_level, code_block_level, @escape_html) ->
    super expression, block_level, code_block_level
    
  evaluate: ->
    [expression, identifier, code] = @expression.match(/(-|!=|=)\s(.*)/)
    @opener =
      if identifier == '-'
        "#{@cw}#{code}"
      else if identifier == '!=' or not @escape_html
        "#{@cw}o.push \"#{@hw}\#{#{code}}\""
      else
        "#{@cw}o.push e \"#{@hw}\#{#{code}}\""
