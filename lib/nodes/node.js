(function() {
  var Node, e, w;
  e = require('../helper').escape;
  w = require('../helper').whitespace;
  module.exports = Node = (function() {
    function Node(parent_node, expression, block_level, code_block_level, escape_html, format) {
      this.parent_node = parent_node != null ? parent_node : null;
      this.expression = expression != null ? expression : '';
      this.block_level = block_level != null ? block_level : 0;
      this.code_block_level = code_block_level != null ? code_block_level : 2;
      this.escape_html = escape_html != null ? escape_html : true;
      this.format = format != null ? format : 'html5';
      this.children = [];
      this.opener = this.closer = '';
      this.silent = false;
      this.cw = w(this.code_block_level);
      this.hw = w(this.block_level);
    }
    Node.prototype.addChild = function(child) {
      this.children.push(child);
      return this;
    };
    Node.prototype.getOpener = function() {
      this.evaluateIfNecessary();
      return this.opener;
    };
    Node.prototype.getCloser = function() {
      this.evaluateIfNecessary();
      return this.closer;
    };
    Node.prototype.evaluateIfNecessary = function() {
      if (!this.evaluated) {
        this.evaluate();
      }
      return this.evaluated = true;
    };
    Node.prototype.evaluate = function() {};
    Node.prototype.render = function() {
      var child, output, _i, _j, _len, _len2, _ref, _ref2;
      output = '';
      if (this.children.length === 0) {
        if (this.getOpener().length > 0 && this.getCloser().length > 0) {
          output = "" + this.cw + "o.push \"" + this.hw + (this.getOpener()) + (this.getCloser()) + "\"\n";
        } else if (this.getOpener().length > 0) {
          output = "" + this.cw + "o.push \"" + this.hw + (this.getOpener()) + "\"\n";
        }
      } else {
        if (this.getOpener().length > 0 && this.getCloser().length > 0) {
          output = "" + this.cw + "o.push \"" + this.hw + (this.getOpener()) + "\"\n";
          _ref = this.children;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            child = _ref[_i];
            output += "" + (child.render());
          }
          if (this.getCloser().length > 0) {
            output += "" + this.cw + "o.push \"" + this.hw + (this.getCloser()) + "\"\n";
          }
        } else {
          if (!this.silent) {
            _ref2 = this.children;
            for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
              child = _ref2[_j];
              output += "" + (child.render());
            }
          }
        }
      }
      return output;
    };
    return Node;
  })();
}).call(this);
