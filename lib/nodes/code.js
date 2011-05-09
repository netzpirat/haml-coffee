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
    function Code() {
      Code.__super__.constructor.apply(this, arguments);
    }
    __extends(Code, Node);
    Code.prototype.evaluate = function() {
      var code, expression, identifier, _ref;
      _ref = this.expression.match(/(-|=)\s(.*)/), expression = _ref[0], identifier = _ref[1], code = _ref[2];
      return this.opener = identifier === '-' ? "" + this.cw + code : "" + this.cw + "o.push \"" + this.hw + "\#{" + code + "}\"";
    };
    return Code;
  })();
}).call(this);
