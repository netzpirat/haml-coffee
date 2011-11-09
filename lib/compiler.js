(function() {
  var Code, Comment, Compiler, Filter, Haml, Node, Text;
  Node = require('./nodes/node');
  Text = require('./nodes/text');
  Haml = require('./nodes/haml');
  Code = require('./nodes/code');
  Comment = require('./nodes/comment');
  Filter = require('./nodes/filter');
  module.exports = Compiler = (function() {
    function Compiler(options) {
      var _base, _base2, _ref, _ref2;
      this.options = options != null ? options : {};
      if ((_ref = (_base = this.options).escape_html) == null) {
        _base.escape_html = true;
      }
      if ((_ref2 = (_base2 = this.options).format) == null) {
        _base2.format = 'html5';
      }
    }
    Compiler.prototype.node_factory = function(expression, previous_node, parent_node, current_block_level, current_code_block_level) {
      var node, top_filter_node;
      if (expression === '' && previous_node instanceof Filter) {
        top_filter_node = previous_node.getFilterExpressionNode();
        node = new Filter(top_filter_node, expression, current_block_level, current_code_block_level, this.options.escape_html, this.options.format);
        top_filter_node.addChild(node);
      } else if (parent_node instanceof Filter || expression.match(/^:(escaped|preserve|css|javascript|plain|coffeescript)/)) {
        node = new Filter(parent_node, expression, current_block_level, current_code_block_level, this.options.escape_html, this.options.format);
        parent_node.addChild(node);
      } else if (expression.match(/^(\/|-#)(.*)/)) {
        node = new Comment(parent_node, expression, current_block_level, current_code_block_level, this.options.escape_html, this.options.format);
        parent_node.addChild(node);
      } else if (expression.match(/^(-#|-|=|!=)\s*(.*)/)) {
        node = new Code(parent_node, expression, current_block_level, current_code_block_level, this.options.escape_html);
        parent_node.addChild(node);
      } else if (expression.match(/^(%|#|\.|\!)(.*)/)) {
        node = new Haml(parent_node, expression, current_block_level, current_code_block_level, this.options.escape_html, this.options.format);
        parent_node.addChild(node);
      } else {
        node = new Text(parent_node, expression, current_block_level, current_code_block_level);
        parent_node.addChild(node);
      }
      return node;
    };
    Compiler.prototype.update_code_block_level = function(node) {
      if (node instanceof Code) {
        return this.current_code_block_level = node.code_block_level + 1;
      } else {
        return this.current_code_block_level = node.code_block_level;
      }
    };
    Compiler.prototype.indent_changed = function() {
      return this.current_indent !== this.previous_indent;
    };
    Compiler.prototype.is_indent = function() {
      return this.current_indent > this.previous_indent;
    };
    Compiler.prototype.update_tab_size = function() {
      if (this.tab_size === 0) {
        return this.tab_size = this.current_indent - this.previous_indent;
      }
    };
    Compiler.prototype.update_block_level = function() {
      this.current_block_level = this.current_indent / this.tab_size;
      if (this.current_block_level - Math.floor(this.current_block_level) > 0) {
        throw "Indentation error in line " + this.line_number;
      }
      if ((this.current_indent - this.previous_indent) / this.tab_size > 1) {
        throw "Block level too deep in line " + this.line_number;
      }
      return this.delta = this.previous_block_level - this.current_block_level;
    };
    Compiler.prototype.push_parent = function() {
      this.stack.push(this.parent_node);
      return this.parent_node = this.node;
    };
    Compiler.prototype.pop_parent = function() {
      var i, _ref, _results;
      _results = [];
      for (i = 0, _ref = this.delta - 1; 0 <= _ref ? i <= _ref : i >= _ref; 0 <= _ref ? i++ : i--) {
        _results.push(this.parent_node = this.stack.pop());
      }
      return _results;
    };
    Compiler.prototype.parse = function(source) {
      var attributes, expression, line, lines, result, whitespace, _ref, _results;
      this.line_number = this.previous_indent = this.tab_size = this.current_block_level = this.previous_block_level = 0;
      this.current_code_block_level = this.previous_code_block_level = 2;
      this.node = null;
      this.stack = [];
      this.root = this.parent_node = new Node();
      lines = source.split("\n");
      _results = [];
      while ((line = lines.shift()) !== void 0) {
        result = line.match(/^(\s*)(.*)/);
        whitespace = result[1];
        expression = result[2];
        while ((_ref = lines[0]) != null ? _ref.match(/([^:|\s|=]+\s*=>\s*(("[^"]+")|('[^']+')|[^\s,\}]+))|([\w]+=(("[^"]+")|('[^']+')|[^\s\)]+))/g) : void 0) {
          attributes = lines.shift();
          expression += ' ' + attributes.match(/^(\s*)(.*)/)[2];
          this.line_number++;
        }
        this.current_indent = whitespace.length;
        if (this.indent_changed()) {
          this.update_tab_size();
          this.update_block_level();
          if (this.is_indent()) {
            this.push_parent();
          } else {
            this.pop_parent();
          }
          this.update_code_block_level(this.parent_node);
        }
        this.node = this.node_factory(expression, this.node, this.parent_node, this.current_block_level, this.current_code_block_level);
        this.previous_block_level = this.current_block_level;
        this.previous_indent = this.current_indent;
        _results.push(this.line_number++);
      }
      return _results;
    };
    Compiler.prototype.parameterize = function(filename) {
      return filename.replace(/(\s|-)+/g, "_");
    };
    Compiler.prototype.render = function(filename, namespace) {
      var html_escape_function_name, name, output, segment, segments, _i, _len;
      if (namespace == null) {
        namespace = "HAML";
      }
      output = "window." + namespace + " ?= {}\n";
      if (this.options.escape_html) {
        if (this.options.custom_html_escape) {
          html_escape_function_name = this.options.custom_html_escape;
        } else {
          html_escape_function_name = "window." + namespace + ".html_escape";
          output += html_escape_function_name + '||= (text) ->\n  "#{text}"\n  .replace(/&/g, "&amp;")\n  .replace(/</g, "&lt;")\n  .replace(/>/g, "&gt;")\n  .replace(/\'/g, "&apos;")\n  .replace(/\"/g, "&quot;")';
        }
      }
      segments = this.parameterize(filename).split('/');
      name = segments.pop();
      for (_i = 0, _len = segments.length; _i < _len; _i++) {
        segment = segments[_i];
        namespace += "." + segment;
        output += "window." + namespace + " ?= {}\n";
      }
      output += "window." + namespace + "." + name + " = (context) ->\n";
      output += "  fn = (context) ->\n";
      output += "    o = []\n";
      if (this.options.escape_html) {
        output += "    e = " + html_escape_function_name + "\n";
      }
      output += this.root.render();
      output += "    return o.join(\"\\n\")\n";
      output += "  return fn.call(context)\n";
      return output;
    };
    return Compiler;
  })();
}).call(this);
