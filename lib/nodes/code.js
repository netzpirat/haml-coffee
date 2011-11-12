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
      this.opener = identifier === '-' ? "" + this.cw + code : identifier === '!=' || !this.escape_html ? "" + this.cw + "val = \"" + this.hw + "\#{" + code + "}\"\n" + this.cw + "o.push val" : "" + this.cw + "val = \"" + this.hw + "\#{" + code + "}\"\n" + this.cw + "o.push e val";
      if (identifier === '-' && this.children.length > 0) {
        if (this.expression.match(/->$/)) {
          this.opener = "" + this.opener + "\n" + this.cw + "  o0 = (k for k in o)\n" + this.cw + "  o = []";
          return this.closer = "" + this.cw + "  ret = o.join(\"\\n\")\n" + this.cw + "  o = (k for k in o0)\n" + this.cw + "  ret\n";
        } else {
          return this.closer = "" + this.cw + "  ''";
        }
      }
    };
    return Code;
  })();
}).call(this);
