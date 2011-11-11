(function() {
  var Code, Comment, Compiler, Filter, Haml, Node, Text, w;

  Node = require('./nodes/node');

  Text = require('./nodes/text');

  Haml = require('./nodes/haml');

  Code = require('./nodes/code');

  Comment = require('./nodes/comment');

  Filter = require('./nodes/filter');

  w = require('./helper').whitespace;

  module.exports = Compiler = (function() {

    function Compiler(options) {
      var _base, _base2, _base3, _ref, _ref2, _ref3;
      this.options = options != null ? options : {};
      if ((_ref = (_base = this.options).escapeHtml) == null) {
        _base.escapeHtml = true;
      }
      if ((_ref2 = (_base2 = this.options).escapeAttributes) == null) {
        _base2.escapeAttributes = true;
      }
      if ((_ref3 = (_base3 = this.options).format) == null) {
        _base3.format = 'html5';
      }
    }

    Compiler.prototype.getNodeOptions = function() {
      return {
        parentNode: this.parentNode,
        blockLevel: this.currentBlockLevel,
        codeBlockLevel: this.currentCodeBlockLevel,
        escapeHtml: this.options.escapeHtml,
        escapeAttributes: this.options.escapeAttributes,
        format: this.options.format
      };
    };

    Compiler.prototype.nodeFactory = function(expression) {
      var node, options, previousNode, _ref;
      if (expression == null) expression = '';
      previousNode = this.node;
      options = this.getNodeOptions();
      if (expression === '' && previousNode instanceof Filter) {
        options.parentNode = previousNode.getFilterExpressionNode();
        node = new Filter(expression, options);
      } else if (options.parentNode instanceof Filter || expression.match(/^:(escaped|preserve|css|javascript|plain)/)) {
        node = new Filter(expression, options);
      } else if (expression.match(/^(\/|-#)(.*)/)) {
        node = new Comment(expression, options);
      } else if (expression.match(/^(-#|-|=|!=|\&=|~)\s*(.*)/)) {
        node = new Code(expression, options);
      } else if (expression.match(/^(%|#|\.|\!)(.*)/)) {
        node = new Haml(expression, options);
      } else {
        node = new Text(expression, options);
      }
      if ((_ref = options.parentNode) != null) _ref.addChild(node);
      return node;
    };

    Compiler.prototype.updateCodeBlockLevel = function(node) {
      if (node instanceof Code) {
        return this.currentCodeBlockLevel = node.codeBlockLevel + 1;
      } else {
        return this.currentCodeBlockLevel = node.codeBlockLevel;
      }
    };

    Compiler.prototype.indentChanged = function() {
      return this.currentIndent !== this.previousIndent;
    };

    Compiler.prototype.isIndent = function() {
      return this.currentIndent > this.previousIndent;
    };

    Compiler.prototype.updateTabSize = function() {
      if (this.tabSize === 0) {
        return this.tabSize = this.currentIndent - this.previousIndent;
      }
    };

    Compiler.prototype.updateBlockLevel = function() {
      this.currentBlockLevel = this.currentIndent / this.tabSize;
      if (this.currentBlockLevel - Math.floor(this.currentBlockLevel) > 0) {
        if (!(this.node instanceof Filter)) {
          throw "Indentation error in line " + this.line_number;
        }
      }
      if ((this.currentIndent - this.previousIndent) / this.tabSize > 1) {
        if (!(this.node instanceof Filter)) {
          throw "Block level too deep in line " + this.line_number;
        }
      }
      return this.delta = this.previousBlockLevel - this.currentBlockLevel;
    };

    Compiler.prototype.pushParent = function() {
      this.stack.push(this.parentNode);
      return this.parentNode = this.node;
    };

    Compiler.prototype.popParent = function() {
      var i, _ref, _results;
      _results = [];
      for (i = 0, _ref = this.delta - 1; 0 <= _ref ? i <= _ref : i >= _ref; 0 <= _ref ? i++ : i--) {
        _results.push(this.parentNode = this.stack.pop());
      }
      return _results;
    };

    Compiler.prototype.parse = function(source) {
      var attributes, expression, line, lines, result, whitespace, _ref, _ref2;
      this.line_number = this.previousIndent = this.tabSize = this.currentBlockLevel = this.previousBlockLevel = 0;
      this.currentCodeBlockLevel = this.previousCodeBlockLevel = 2;
      this.node = null;
      this.stack = [];
      this.root = this.parentNode = new Node('', this.getNodeOptions());
      lines = source.split("\n");
      while ((line = lines.shift()) !== void 0) {
        if (line === '' && !(this.node instanceof Filter)) continue;
        result = line.match(/^(\s*)(.*)/);
        whitespace = result[1];
        expression = result[2];
        while (expression.match(/^%/) && !((_ref = lines[0]) != null ? _ref.match(/^(\s*)%/) : void 0) && ((_ref2 = lines[0]) != null ? _ref2.match(/([^:|\s|=]+\s*=>\s*(("[^"]+")|('[^']+')|[^\s,\}]+))|([\w]+=(("[^"]+")|('[^']+')|[^\s\)]+))/g) : void 0)) {
          attributes = lines.shift();
          expression += ' ' + attributes.match(/^(\s*)(.*)/)[2];
          this.line_number++;
        }
        this.currentIndent = whitespace.length;
        if (this.indentChanged()) {
          this.updateTabSize();
          this.updateBlockLevel();
          if (this.isIndent()) {
            this.pushParent();
          } else {
            this.popParent();
          }
          this.updateCodeBlockLevel(this.parentNode);
        }
        this.node = this.nodeFactory(expression);
        this.previousBlockLevel = this.currentBlockLevel;
        this.previousIndent = this.currentIndent;
        this.line_number++;
      }
      return this.evaluate(this.root);
    };

    Compiler.prototype.evaluate = function(node) {
      var child, _i, _len, _ref;
      _ref = node.children;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        child = _ref[_i];
        this.evaluate(child);
      }
      return node.evaluate();
    };

    Compiler.prototype.render = function(templateName, namespace) {
      var code, escapeFn, output, segment, segments, _i, _len;
      if (namespace == null) namespace = 'window.HAML';
      output = '';
      segments = ("" + namespace + "." + templateName).replace(/(\s|-)+/g, '_').split(/\.|\//);
      templateName = segments.pop();
      namespace = segments.shift();
      for (_i = 0, _len = segments.length; _i < _len; _i++) {
        segment = segments[_i];
        namespace += "." + segment;
        output += "" + namespace + " ?= {}\n";
      }
      if (this.options.customHtmlEscape) {
        escapeFn = this.options.customHtmlEscape;
      } else {
        escapeFn = "" + namespace + ".htmlEscape";
        output += escapeFn + '||= (text) ->\n  "#{ text }"\n  .replace(/&/g, \'&amp;\')\n  .replace(/</g, \'&lt;\')\n  .replace(/>/g, \'&gt;\')\n  .replace(/\'/g, \'&apos;\')\n  .replace(/\"/g, \'&quot;\')\n';
      }
      output += "" + namespace + "." + templateName + " = (context) ->\n";
      output += "  fn = (context) ->\n";
      output += "    o = []\n";
      output += "    e = " + escapeFn + "\n";
      code = this.createCode();
      output += "" + code + "\n";
      output += "    return o.join(\"\\n\")" + (this.cleanupWhitespace(code)) + "\n";
      output += "  return fn.call(context)";
      return output;
    };

    Compiler.prototype.createCode = function() {
      var child, code, line, _i, _j, _len, _len2, _ref, _ref2;
      code = [];
      this.lines = [];
      _ref = this.root.children;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        child = _ref[_i];
        this.lines = this.lines.concat(child.render());
      }
      _ref2 = this.lines;
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        line = _ref2[_j];
        if (line !== null) {
          switch (line.type) {
            case 'text':
              code.push("" + (w(line.cw)) + "o.push \"" + (w(line.hw)) + line.text + "\"");
              break;
            case 'run':
              code.push("" + (w(line.cw)) + line.code);
              break;
            case 'insert':
              if (line.hw === 0) {
                code.push("" + (w(line.cw)) + "o.push " + (w(line.escape) ? 'e ' : '') + line.code);
              } else {
                code.push("" + (w(line.cw)) + "o.push " + (w(line.escape) ? 'e' : '') + " \"" + (w(line.hw)) + "\" + " + line.code);
              }
          }
        }
      }
      return code.join('\n');
    };

    Compiler.prototype.cleanupWhitespace = function(code) {
      if (/\u0091|\u0092/.test(code)) {
        return ".replace(/[\\s\\n]*\\u0091/mg, '').replace(/\\u0092[\\s\\n]*/mg, '')";
      } else {
        return '';
      }
    };

    return Compiler;

  })();

}).call(this);
