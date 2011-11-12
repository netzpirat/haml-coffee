(function() {
  var Node, e, w;
  e = require('../helper').escape;
  w = require('../helper').whitespace;
  module.exports = Node = (function() {
    function Node(expression, block_level, code_block_level) {
      this.expression = expression;
      this.block_level = block_level;
      this.code_block_level = code_block_level;
      this.children = [];
      this.opener = this.closer = "";
      this.cw = w(this.code_block_level);
      this.hw = w(this.block_level - this.code_block_level);
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
      var child, output, _i, _len, _ref;
      output = "" + (this.getOpener()) + "\n";
      _ref = this.children;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        child = _ref[_i];
        output += "" + (child.render());
      }
      if (this.getCloser().length > 0) {
        output += "" + (this.getCloser()) + "\n";
      }
      return output;
    };
    return Node;
  })();
}).call(this);
