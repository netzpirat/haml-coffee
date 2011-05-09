e = require('../helper').escape
w = require('../helper').whitespace

# base class for syntax tree
module.exports = class Node
  constructor: (@expression, @block_level, @code_block_level) ->
    @children = []
    @opener = @closer = ""
    @cw = w(@code_block_level)                   # Code Whitespace
    @hw = w(@block_level - @code_block_level)    # HTML Whitespace
  addChild: (child) ->
    @children.push child
    return @
  getOpener: ->
    @evaluateIfNecessary()
    @opener
  getCloser: ->
    @evaluateIfNecessary()
    @closer
  evaluateIfNecessary: ->
    @evaluate() unless @evaluated
    @evaluated = true
  evaluate: ->
  render: ->
    output = "#{@getOpener()}\n"
    for child in @children
      output +="#{child.render()}"
    output += "#{@getCloser()}\n" if @getCloser().length > 0
    
    return output
