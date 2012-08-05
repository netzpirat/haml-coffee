(function() {
  var Code, Comment, Filter, Haml, HamlCoffee, Node, Text, indent, whitespace;

  Node = require('./nodes/node');

  Text = require('./nodes/text');

  Haml = require('./nodes/haml');

  Code = require('./nodes/code');

  Comment = require('./nodes/comment');

  Filter = require('./nodes/filter');

  whitespace = require('./util/text').whitespace;

  indent = require('./util/text').indent;

  module.exports = HamlCoffee = (function() {

    HamlCoffee.VERSION = '1.4.0';

    function HamlCoffee(options) {
      var _base, _base1, _base2, _base3, _base4, _base5, _base6, _base7, _base8, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8;
      this.options = options != null ? options : {};
      if ((_ref = (_base = this.options).escapeHtml) == null) {
        _base.escapeHtml = true;
      }
      if ((_ref1 = (_base1 = this.options).escapeAttributes) == null) {
        _base1.escapeAttributes = true;
      }
      if ((_ref2 = (_base2 = this.options).cleanValue) == null) {
        _base2.cleanValue = true;
      }
      if ((_ref3 = (_base3 = this.options).uglify) == null) {
        _base3.uglify = false;
      }
      if ((_ref4 = (_base4 = this.options).basename) == null) {
        _base4.basename = false;
      }
      if ((_ref5 = (_base5 = this.options).extendScope) == null) {
        _base5.extendScope = false;
      }
      if ((_ref6 = (_base6 = this.options).format) == null) {
        _base6.format = 'html5';
      }
      if ((_ref7 = (_base7 = this.options).preserveTags) == null) {
        _base7.preserveTags = 'pre,textarea';
      }
      if ((_ref8 = (_base8 = this.options).selfCloseTags) == null) {
        _base8.selfCloseTags = 'meta,img,link,br,hr,input,area,param,col,base';
      }
    }

    HamlCoffee.prototype.indentChanged = function() {
      return this.currentIndent !== this.previousIndent;
    };

    HamlCoffee.prototype.isIndent = function() {
      return this.currentIndent > this.previousIndent;
    };

    HamlCoffee.prototype.updateTabSize = function() {
      if (this.tabSize === 0) {
        return this.tabSize = this.currentIndent - this.previousIndent;
      }
    };

    HamlCoffee.prototype.updateBlockLevel = function() {
      this.currentBlockLevel = this.currentIndent / this.tabSize;
      if (this.currentBlockLevel - Math.floor(this.currentBlockLevel) > 0) {
        throw "Indentation error in line " + this.lineNumber;
      }
      if ((this.currentIndent - this.previousIndent) / this.tabSize > 1) {
        if (!this.node.isCommented()) {
          throw "Block level too deep in line " + this.lineNumber;
        }
      }
      return this.delta = this.previousBlockLevel - this.currentBlockLevel;
    };

    HamlCoffee.prototype.updateCodeBlockLevel = function(node) {
      if (node instanceof Code) {
        return this.currentCodeBlockLevel = node.codeBlockLevel + 1;
      } else {
        return this.currentCodeBlockLevel = node.codeBlockLevel;
      }
    };

    HamlCoffee.prototype.updateParent = function() {
      if (this.isIndent()) {
        return this.pushParent();
      } else {
        return this.popParent();
      }
    };

    HamlCoffee.prototype.pushParent = function() {
      this.stack.push(this.parentNode);
      return this.parentNode = this.node;
    };

    HamlCoffee.prototype.popParent = function() {
      var i, _i, _ref, _results;
      _results = [];
      for (i = _i = 0, _ref = this.delta - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
        _results.push(this.parentNode = this.stack.pop());
      }
      return _results;
    };

    HamlCoffee.prototype.getNodeOptions = function(override) {
      if (override == null) {
        override = {};
      }
      return {
        parentNode: override.parentNode || this.parentNode,
        blockLevel: override.blockLevel || this.currentBlockLevel,
        codeBlockLevel: override.codeBlockLevel || this.currentCodeBlockLevel,
        escapeHtml: override.escapeHtml || this.options.escapeHtml,
        escapeAttributes: override.escapeAttributes || this.options.escapeAttributes,
        cleanValue: override.cleanValue || this.options.cleanValue,
        format: override.format || this.options.format,
        preserveTags: override.preserveTags || this.options.preserveTags,
        selfCloseTags: override.selfCloseTags || this.options.selfCloseTags,
        uglify: override.uglify || this.options.uglify
      };
    };

    HamlCoffee.prototype.nodeFactory = function(expression) {
      var node, options, _ref;
      if (expression == null) {
        expression = '';
      }
      options = this.getNodeOptions();
      if (expression.match(/^:(escaped|preserve|css|javascript|plain|cdata|coffeescript)/)) {
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
      if ((_ref = options.parentNode) != null) {
        _ref.addChild(node);
      }
      return node;
    };

    HamlCoffee.prototype.parse = function(source) {
      var attributes, expression, line, lines, result, text, ws, _ref;
      if (source == null) {
        source = '';
      }
      this.lineNumber = this.previousIndent = this.tabSize = this.currentBlockLevel = this.previousBlockLevel = 0;
      this.currentCodeBlockLevel = this.previousCodeBlockLevel = 0;
      this.node = null;
      this.stack = [];
      this.root = this.parentNode = new Node('', this.getNodeOptions());
      lines = source.split("\n");
      while ((line = lines.shift()) !== void 0) {
        if ((this.node instanceof Filter) && !this.exitFilter) {
          if (/^(\s)*$/.test(line)) {
            this.node.addChild(new Text('', this.getNodeOptions({
              parentNode: this.node
            })));
          } else {
            result = line.match(/^(\s*)(.*)/);
            ws = result[1];
            expression = result[2];
            if (this.node.blockLevel >= (ws.length / 2)) {
              this.exitFilter = true;
              lines.unshift(line);
              continue;
            }
            text = line.match(RegExp("^\\s{" + ((this.node.blockLevel * 2) + 2) + "}(.*)"));
            if (text) {
              this.node.addChild(new Text(text[1], this.getNodeOptions({
                parentNode: this.node
              })));
            }
          }
        } else {
          this.exitFilter = false;
          result = line.match(/^(\s*)(.*)/);
          ws = result[1];
          expression = result[2];
          if (/^\s*$/.test(line)) {
            continue;
          }
          while (/^[%.#].*[{(]/.test(expression) && !/^(\s*)[-=&!~.%#</]/.test(lines[0]) && /([-\w]+[\w:-]*\w?)\s*=|('\w+[\w:-]*\w?')\s*=|("\w+[\w:-]*\w?")\s*=|(\w+[\w:-]*\w?):|('[-\w]+[\w:-]*\w?'):|("[-\w]+[\w:-]*\w?"):|:(\w+[\w:-]*\w?)\s*=>|:?'([-\w]+[\w:-]*\w?)'\s*=>|:?"([-\w]+[\w:-]*\w?)"\s*=>/.test(lines[0])) {
            attributes = lines.shift();
            expression = expression.replace(/(\s)+\|\s*$/, '');
            expression += ' ' + attributes.match(/^\s*(.*?)(\s+\|\s*)?$/)[1];
            this.lineNumber++;
          }
          if (expression.match(/(\s)+\|\s*$/)) {
            expression = expression.replace(/(\s)+\|\s*$/, ' ');
            while ((_ref = lines[0]) != null ? _ref.match(/(\s)+\|$/) : void 0) {
              expression += lines.shift().match(/^(\s*)(.*)/)[2].replace(/(\s)+\|\s*$/, '');
              this.lineNumber++;
            }
          }
          this.currentIndent = ws.length;
          if (this.indentChanged()) {
            this.updateTabSize();
            this.updateBlockLevel();
            this.updateParent();
            this.updateCodeBlockLevel(this.parentNode);
          }
          this.node = this.nodeFactory(expression);
          this.previousBlockLevel = this.currentBlockLevel;
          this.previousIndent = this.currentIndent;
        }
        this.lineNumber++;
      }
      return this.evaluate(this.root);
    };

    HamlCoffee.prototype.evaluate = function(node) {
      var child, _i, _len, _ref;
      _ref = node.children;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        child = _ref[_i];
        this.evaluate(child);
      }
      return node.evaluate();
    };

    HamlCoffee.prototype.render = function(templateName, namespace) {
      var segment, segments, template, _i, _len;
      if (namespace == null) {
        namespace = 'window.HAML';
      }
      template = '';
      segments = ("" + namespace + "." + templateName).replace(/(\s|-)+/g, '_').split(/\./);
      templateName = this.options.basename ? segments.pop().split(/\/|\\/).pop() : segments.pop();
      namespace = segments.shift();
      if (segments.length !== 0) {
        for (_i = 0, _len = segments.length; _i < _len; _i++) {
          segment = segments[_i];
          namespace += "." + segment;
          template += "" + namespace + " ?= {}\n";
        }
      } else {
        template += "" + namespace + " ?= {}\n";
      }
      if (this.options.extendScope) {
        template += "" + namespace + "['" + templateName + "'] = (context) -> ( ->\n";
        template += "  `with (context || {}) {`\n";
        template += "" + (indent(this.precompile(), 1));
        template += "`}`\n";
        template += ").call(context)";
      } else {
        template += "" + namespace + "['" + templateName + "'] = (context) -> ( ->\n";
        template += "" + (indent(this.precompile(), 1));
        template += ").call(context)";
      }
      return template;
    };

    HamlCoffee.prototype.precompile = function() {
      var code, fn;
      fn = '';
      code = this.createCode();
      if (code.indexOf('$e') !== -1) {
        if (this.options.customHtmlEscape) {
          fn += "$e = " + this.options.customHtmlEscape + "\n";
        } else {
          fn += "$e = (text, escape) ->\n  \"\#{ text }\"\n  .replace(/&/g, '&amp;')\n  .replace(/</g, '&lt;')\n  .replace(/>/g, '&gt;')\n  .replace(/\'/g, '&#39;')\n  .replace(/\"/g, '&quot;')\n";
        }
      }
      if (code.indexOf('$c') !== -1) {
        if (this.options.customCleanValue) {
          fn += "$c = " + this.options.customCleanValue + "\n";
        } else {
          fn += "$c = (text) ->\n";
          fn += "   switch text\n";
          fn += "     when null, undefined then ''\n";
          fn += "     when true, false then '\u0093' + text\n";
          fn += "     else text\n";
        }
      }
      if (code.indexOf('$p') !== -1 || code.indexOf('$fp') !== -1) {
        if (this.options.customPreserve) {
          fn += "$p = " + this.options.customPreserve + "\n";
        } else {
          fn += "$p = (text) -> text.replace /\\n/g, '&#x000A;'\n";
        }
      }
      if (code.indexOf('$fp') !== -1) {
        if (this.options.customFindAndPreserve) {
          fn += "$fp = " + this.options.customFindAndPreserve + "\n";
        } else {
          fn += "$fp = (text) ->\n  text.replace /<(" + (this.options.preserveTags.split(',').join('|')) + ")>([^]*?)<\\/\\1>/g, (str, tag, content) ->\n    \"<\#{ tag }>\#{ $p content }</\#{ tag }>\"\n";
        }
      }
      if (code.indexOf('surround') !== -1) {
        if (this.options.customSurround) {
          fn += "surround = " + this.options.customSurround + "\n";
        } else {
          fn += "surround = (start, end, fn) -> start + fn() + end\n";
        }
      }
      if (code.indexOf('succeed') !== -1) {
        if (this.options.customSucceed) {
          fn += "succeed = " + this.options.customSucceed + "\n";
        } else {
          fn += "succeed = (end, fn) -> fn() + end\n";
        }
      }
      if (code.indexOf('precede') !== -1) {
        if (this.options.customPrecede) {
          fn += "precede = " + this.options.customPrecede + "\n";
        } else {
          fn += "precede = (start, fn) -> start + fn()\n";
        }
      }
      fn += "$o = []\n";
      fn += "" + code + "\n";
      return fn += "return $o.join(\"\\n\")" + (this.convertBooleans(code)) + (this.cleanupWhitespace(code)) + "\n";
    };

    HamlCoffee.prototype.createCode = function() {
      var child, code, line, processors, _i, _j, _len, _len1, _ref, _ref1;
      code = [];
      this.lines = [];
      _ref = this.root.children;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        child = _ref[_i];
        this.lines = this.lines.concat(child.render());
      }
      this.lines = this.combineText(this.lines);
      this.blockLevel = 0;
      _ref1 = this.lines;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        line = _ref1[_j];
        if (line !== null) {
          switch (line.type) {
            case 'text':
              code.push("" + (whitespace(line.cw)) + (this.getBuffer(this.blockLevel)) + ".push \"" + (whitespace(line.hw)) + line.text + "\"");
              break;
            case 'run':
              if (line.block !== 'end') {
                code.push("" + (whitespace(line.cw)) + line.code);
              } else {
                code.push("" + (whitespace(line.cw)) + (line.code.replace('$buffer', this.getBuffer(this.blockLevel))));
                this.blockLevel -= 1;
              }
              break;
            case 'insert':
              processors = '';
              if (line.findAndPreserve) {
                processors += '$fp ';
              }
              if (line.preserve) {
                processors += '$p ';
              }
              if (line.escape) {
                processors += '$e ';
              }
              if (this.options.cleanValue) {
                processors += '$c ';
              }
              code.push("" + (whitespace(line.cw)) + (this.getBuffer(this.blockLevel)) + ".push \"" + (whitespace(line.hw)) + "\" + " + processors + line.code);
              if (line.block === 'start') {
                this.blockLevel += 1;
                code.push("" + (whitespace(line.cw + 1)) + (this.getBuffer(this.blockLevel)) + " = []");
              }
          }
        }
      }
      return code.join('\n');
    };

    HamlCoffee.prototype.getBuffer = function(level) {
      if (level > 0) {
        return "$o" + level;
      } else {
        return '$o';
      }
    };

    HamlCoffee.prototype.combineText = function(lines) {
      var combined, line, nextLine;
      combined = [];
      while ((line = lines.shift()) !== void 0) {
        if (line.type === 'text') {
          while (lines[0] && lines[0].type === 'text' && line.cw === lines[0].cw) {
            nextLine = lines.shift();
            line.text += "\\n" + (whitespace(nextLine.hw)) + nextLine.text;
          }
        }
        combined.push(line);
      }
      return combined;
    };

    HamlCoffee.prototype.convertBooleans = function(code) {
      if (this.options.format === 'xhtml') {
        return '.replace(/\\s(\\w+)=\'\u0093true\'/mg, " $1=\'$1\'").replace(/\\s(\\w+)=\'\u0093false\'/mg, \'\')';
      } else {
        return '.replace(/\\s(\\w+)=\'\u0093true\'/mg, \' $1\').replace(/\\s(\\w+)=\'\u0093false\'/mg, \'\')';
      }
    };

    HamlCoffee.prototype.cleanupWhitespace = function(code) {
      if (/\u0091|\u0092/.test(code)) {
        return ".replace(/[\\s\\n]*\\u0091/mg, '').replace(/\\u0092[\\s\\n]*/mg, '')";
      } else {
        return '';
      }
    };

    return HamlCoffee;

  })();

}).call(this);
