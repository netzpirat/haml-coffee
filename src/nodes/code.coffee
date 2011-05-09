Node  = require('./node')
e     = require('../helper').escape

# Code Node
module.exports = class Code extends Node
  evaluate: ->
    [expression, identifier, code] = @expression.match(/(-|=)\s(.*)/)
    
    @opener = if identifier == '-'
      "#{@cw}#{code}"
    else
      "#{@cw}o.push \"#{@hw}\#{#{code}}\""
