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
        "#{@cw}val = \"#{@hw}\#{#{code}}\"\n#{@cw}o.push val"
        #"#{@cw}o.push \"#{@hw}\#{#{code}}\""
      else
        "#{@cw}val = \"#{@hw}\#{#{code}}\"\n#{@cw}o.push e val"
        #"#{@cw}o.push e \"#{@hw}\#{#{code}}\""
    if identifier == '-' and @children.length > 0
      if @expression.match(/->$/)
        @opener = "#{@opener}\n#{@cw}  o0 = (k for k in o)\n#{@cw}  o = []"
        @closer = "#{@cw}  ret = o.join(\"\\n\")\n#{@cw}  o = (k for k in o0)\n#{@cw}  ret\n"
      else
        @closer = "#{@cw}  ''"
