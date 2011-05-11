(function() {
  var Code, Compiler, Haml, Node, Text;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  Node = require('./nodes/node');
  Text = require('./nodes/text');
  Haml = require('./nodes/haml');
  Code = require('./nodes/code');
  module.exports = Compiler = (function() {
    function Compiler() {}
    Compiler.prototype.node_factory = function(expression, current_block_level, current_code_block_level) {
      var node;
      if (expression.match(/^(-|=)\s*(.*)/)) {
        node = new Code(expression, current_block_level, current_code_block_level);
      } else if (expression.match(/^(%|#|\.)(.*)/)) {
        node = new Haml(expression, current_block_level, current_code_block_level);
      } else {
        node = new Text(expression, current_block_level, current_code_block_level);
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
      this.line_number = 0;
      this.previous_indent = 0;
      this.tab_size = 0;
      this.current_block_level = this.previous_block_level = 0;
      this.current_code_block_level = this.previous_code_block_level = 2;
      this.root = this.parent_node = new Node("", this.current_block_level, this.current_code_block_level);
      this.node = null;
      this.stack = [];
      return source.split("\n").forEach(__bind(function(line) {
        var expression, result, whitespace;
        result = line.match(/^(\s*)(.*)/);
        whitespace = result[1];
        expression = result[2];
        if (expression.length > 0) {
          if (!expression.match(/^\//)) {
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
            this.node = this.node_factory(expression, this.current_block_level, this.current_code_block_level);
            this.parent_node.addChild(this.node);
            this.previous_block_level = this.current_block_level;
            this.previous_indent = this.current_indent;
            this.line_number++;
          }
        }
      }, this));
    };
    Compiler.prototype.parameterize = function(s) {
      s = s.replace(/(\s|-)+/g, "_");
      return s;
    };
    Compiler.prototype.render = function(filename, namespace) {
      var name, output, segment, segments, _i, _len;
            if (namespace != null) {
        namespace;
      } else {
        namespace = "HAML";
      };
      output = "window." + namespace + " ?= {}\n";
      segments = this.parameterize(filename).split('/');
      name = segments.pop();
      for (_i = 0, _len = segments.length; _i < _len; _i++) {
        segment = segments[_i];
        namespace += "." + segment;
        output += "window." + namespace + " ?= {}\n";
      }
      output += "window." + namespace + "." + name + " = (context) ->\n";
      output += "  fn = (context) ->\n";
      output += "    o = []";
      output += this.root.render();
      output += "    return o.join(\"\\n\")\n";
      output += "  return fn.call(context)\n";
      return output;
    };
    return Compiler;
  })();
}).call(this);
