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
      var code_block;
      code_block = this.expression.match(/(-|!=|\&=|=|~)\s?(.*)?/);
      this.identifier = code_block[1];
      return this.code = code_block[2];
    };
    Code.prototype.render = function() {
      var output;
      this.evaluateIfNecessary();
      output = '';
      if (this.identifier === '-') {
        output += "" + this.cw + this.code + "\n";
      } else if (this.identifier === '~') {
        output += "" + this.cw + "o.push \"" + this.hw + "\#{" + (this.find_and_preserve(this.code)) + "}\"\n";
      } else if (this.identifier === '&=' || (this.identifier === '=' && this.escape_html)) {
        output += "" + this.cw + "o.push e \"" + this.hw + "\#{" + this.code + "}\"\n";
      } else {
        output += "" + this.cw + "o.push \"" + this.hw + "\#{" + this.code + "}\"\n";
      }
      return output;
    };
    Code.prototype.find_and_preserve = function(code) {
      return code.replace(/<(pre|textarea)>(.*?)<\/\1>/g, function(text) {
        return text.replace('\\n', '\&\#x000A;');
      });
    };
    return Code;
  })();
}).call(this);
