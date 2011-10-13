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
    function Code(expression, block_level, code_block_level, escape_html) {
      this.escape_html = escape_html;
      Code.__super__.constructor.call(this, expression, block_level, code_block_level);
    }
    Code.prototype.evaluate = function() {
      var code, expression, identifier, _ref;
      _ref = this.expression.match(/(-|!=|=)\s(.*)/), expression = _ref[0], identifier = _ref[1], code = _ref[2];
      return this.opener = identifier === '-' ? "" + this.cw + code : identifier === '!=' || !this.escape_html ? "" + this.cw + "o.push \"" + this.hw + "\#{" + code + "}\"" : "" + this.cw + "o.push e \"" + this.hw + "\#{" + code + "}\"";
    };
    return Code;
  })();
}).call(this);
