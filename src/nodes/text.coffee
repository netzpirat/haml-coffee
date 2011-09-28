Node  = require('./node')

# Text Node
module.exports = class Text extends Node
  evaluate: ->
    @opener = "#{@cw}o.push \"#{@hw}#{@expression}\""
