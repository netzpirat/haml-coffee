(function() {
  var Node, e, w;
  e = require('../helper').escape;
  w = require('../helper').whitespace;
  module.exports = Node = (function() {
    function Node(parentNode, expression, blockLevel, codeBlockLevel, escapeHtml, format) {
      this.parentNode = parentNode != null ? parentNode : null;
      this.expression = expression != null ? expression : '';
      this.blockLevel = blockLevel != null ? blockLevel : 0;
      this.codeBlockLevel = codeBlockLevel != null ? codeBlockLevel : 2;
      this.escapeHtml = escapeHtml != null ? escapeHtml : true;
      this.format = format != null ? format : 'html5';
      this.children = [];
      this.opener = this.closer = '';
      this.silent = false;
      this.preserve = false;
      this.cw = w(this.codeBlockLevel);
      this.hw = w(this.blockLevel);
      this.evaluate();
    }
    Node.prototype.addChild = function(child) {
      this.children.push(child);
      return this;
    };
    Node.prototype.getOpener = function() {
      return this.opener;
    };
    Node.prototype.getCloser = function() {
      return this.closer;
    };
    Node.prototype.isPreserved = function() {
      if (this.preserve) {
        return true;
      }
      if (this.parentNode) {
        return this.parentNode.isPreserved();
      } else {
        return false;
      }
    };
    Node.prototype.getHtmlIndention = function() {
      if (this.isPreserved()) {
        return '';
      } else {
        return this.hw;
      }
    };
    Node.prototype.outputHtml = function(html) {
      return "" + this.cw + "o.push \"" + (this.getHtmlIndention()) + html + "\"\n";
    };
    Node.prototype.outputCode = function(code) {
      return "" + this.cw + code + "\n";
    };
    Node.prototype.outputCodeHtml = function(code, escape) {
      if (escape == null) {
        escape = false;
      }
      if (escape) {
        return "" + this.cw + "o.push e \"" + (this.getHtmlIndention()) + "\#{" + code + "}\"\n";
      } else {
        return "" + this.cw + "o.push \"" + (this.getHtmlIndention()) + "\#{" + code + "}\"\n";
      }
    };
    Node.prototype.evaluate = function() {};
    Node.prototype.render = function() {
      var child, output, _i, _j, _k, _len, _len2, _len3, _ref, _ref2, _ref3;
      output = '';
      if (this.children.length === 0) {
        if (this.getOpener().length > 0 && this.getCloser().length > 0) {
          output = this.outputHtml(this.getOpener() + this.getCloser());
        } else if (this.getOpener().length > 0) {
          if (!this.preserve && this.isPreserved()) {
            output = this.getOpener();
          } else {
            output = this.outputHtml(this.getOpener());
          }
        }
      } else {
        if (this.getOpener().length > 0 && this.getCloser().length > 0) {
          if (this.preserve) {
            output = this.getOpener();
            _ref = this.children;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              child = _ref[_i];
              output += "" + (child.render()) + "\\n";
            }
            output = output.replace(/\\n$/, '');
            output += this.getCloser();
            output = this.outputHtml(output);
          } else {
            output = this.outputHtml(this.getOpener());
            _ref2 = this.children;
            for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
              child = _ref2[_j];
              output += child.render();
            }
            output += this.outputHtml(this.getCloser());
          }
        } else {
          if (!this.silent) {
            _ref3 = this.children;
            for (_k = 0, _len3 = _ref3.length; _k < _len3; _k++) {
              child = _ref3[_k];
              output += child.render();
            }
          }
        }
      }
      return output;
    };
    return Node;
  })();
}).call(this);
