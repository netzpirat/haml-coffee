Node  = require('./nodes/node')
Text  = require('./nodes/text')
Haml  = require('./nodes/haml')
Code  = require('./nodes/code')

module.exports = class Compiler
  constructor: (@options = {}) ->
    @options.escape_html ?= true
    
  node_factory: (expression, current_block_level, current_code_block_level) ->
    if expression.match(/^(-|=|!=)\s*(.*)/)
      node = new Code(expression, current_block_level, current_code_block_level, @options.escape_html)
    else if expression.match(/^(%|#|\.)(.*)/)
      node = new Haml(expression, current_block_level, current_code_block_level, @options.escape_html)
    else
      node = new Text(expression, current_block_level, current_code_block_level)
    return node
  
  update_code_block_level: (node) ->
    if node instanceof Code
      @current_code_block_level = node.code_block_level + 1
    else
      @current_code_block_level = node.code_block_level
  
  indent_changed: ->
    @current_indent != @previous_indent
  
  is_indent: ->
    @current_indent > @previous_indent
  
  update_tab_size: ->
     @tab_size = @current_indent - @previous_indent if @tab_size == 0
  
  update_block_level: ->
    @current_block_level = @current_indent / @tab_size
    if @current_block_level - Math.floor(@current_block_level) > 0 then throw("Indentation error in line #{@line_number}")
    if (@current_indent - @previous_indent) / @tab_size > 1 then throw("Block level too deep in line #{@line_number}")

    @delta = @previous_block_level - @current_block_level
  
  push_parent: ->
    @stack.push(@parent_node)
    @parent_node = @node
  
  pop_parent: ->
    for i in [0..@delta-1]
      @parent_node = @stack.pop()
  
  # reads a file and builds the datastructures
  parse: (source) ->
    @line_number = 0
    @previous_indent  = 0
    @tab_size = 0
    @current_block_level = @previous_block_level = 0
    @current_code_block_level = @previous_code_block_level = 2
    @root = @parent_node = new Node("", @current_block_level, @current_code_block_level)
    @node = null
    @stack = []
    
    source.split("\n").forEach (line) =>
      result = line.match /^(\s*)(.*)/
      whitespace = result[1]
      expression = result[2]
      if expression.length > 0
        unless expression.match /^\// # ignore comments
          @current_indent = whitespace.length
          if @indent_changed()
            @update_tab_size()
            @update_block_level()
            if @is_indent() then @push_parent() else @pop_parent()
            @update_code_block_level(@parent_node)
          @node = @node_factory(expression, @current_block_level, @current_code_block_level)
          @parent_node.addChild(@node)

          @previous_block_level = @current_block_level
          @previous_indent = @current_indent      
          @line_number++
      return

  parameterize: (s) ->
    s = s.replace(/(\s|-)+/g, "_")
    return s
  
  render: (filename, namespace) ->
    namespace ?= "HAML"
    output  = "window.#{namespace} ?= {}\n"
    
    if @options.escape_html
      if @options.custom_html_escape
        html_escape_function_name = @options.custom_html_escape
      else
        html_escape_function_name = "window.#{namespace}.html_escape"
        output +=
          html_escape_function_name +
          '''
          ||= (text) ->
            "#{text}"
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
          
          '''
    
    segments = @parameterize(filename).split('/')
    name     = segments.pop();
    
    for segment in segments
      namespace += ".#{segment}"
      output += "window.#{namespace} ?= {}\n"
      
    output += "window.#{namespace}.#{name} = (context) ->\n"
    output += "  fn = (context) ->\n"
    output += "    o = []"
    output += "\n    e = #{html_escape_function_name}" if @options.escape_html
    output += @root.render()
    output += "    return o.join(\"\\n\")\n"
    output += "  return fn.call(context)\n"
    return output
