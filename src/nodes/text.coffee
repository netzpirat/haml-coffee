Node  = require('./node')
e     = require('../helper').escape

# Text Node
module.exports = class Text extends Node
  evaluate: ->
    @opener = "#{@cw}o.push \"#{@hw}#{@expression}\""
