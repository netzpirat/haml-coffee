(function() {
  var Code, Node, e;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  Node = require('./node');
  e = require('../helper').escape;
  module.exports = Code = (function() {
    __extends(Code, Node);
    function Code() {
      Code.__super__.constructor.apply(this, arguments);
    }
    Code.prototype.evaluate = function() {
      var codeBlock;
      codeBlock = this.expression.match(/(-|!=|\&=|=|~)\s?(.*)?/);
      this.identifier = codeBlock[1];
      return this.code = codeBlock[2];
    };
    Code.prototype.render = function() {
      var output;
      this.evaluateIfNecessary();
      output = '';
      if (this.identifier === '-') {
        output += "" + this.cw + this.code + "\n";
      } else if (this.identifier === '~') {
        output += "" + this.cw + "o.push \"" + this.hw + "\#{" + (this.findAndPreserve(this.code)) + "}\"\n";
      } else if (this.identifier === '&=' || (this.identifier === '=' && this.escapeHtml)) {
        output += "" + this.cw + "o.push e \"" + this.hw + "\#{" + this.code + "}\"\n";
      } else {
        output += "" + this.cw + "o.push \"" + this.hw + "\#{" + this.code + "}\"\n";
      }
      return output;
    };
    Code.prototype.findAndPreserve = function(code) {
      return code.replace(/<(pre|textarea)>(.*?)<\/\1>/g, function(text) {
        return text.replace('\\n', '\&\#x000A;');
      });
    };
    return Code;
  })();
}).call(this);
