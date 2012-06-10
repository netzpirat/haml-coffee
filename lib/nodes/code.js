(function() {
  var Code, Node,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Node = require('./node');

  module.exports = Code = (function(_super) {

    __extends(Code, _super);

    function Code() {
      return Code.__super__.constructor.apply(this, arguments);
    }

    Code.prototype.evaluate = function() {
      var code, codeBlock, escape, identifier;
      codeBlock = this.expression.match(/(-|!=|\&=|=|~)\s?(.*)?/);
      identifier = codeBlock[1];
      code = codeBlock[2];
      if (identifier === '-') {
        this.opener = this.markRunningCode(code);
        if (this.children.length !== 0 && this.opener.code.match(/(->|=>)/)) {
          return this.closer = this.markRunningCode("  ''");
        }
      } else if (identifier === '~') {
        if (this.escapeHtml) {
          return this.opener = this.markInsertingCode(code, true, false, true);
        } else {
          return this.opener = this.markInsertingCode(code, false, false, true);
        }
      } else {
        escape = identifier === '&=' || (identifier === '=' && this.escapeHtml);
        if (this.children.length !== 0 && code.match(/(->|=>)$/)) {
          this.opener = this.markInsertingCode(code, escape, false, false);
          this.opener.block = 'start';
          this.closer = this.markRunningCode("  $buffer.join \"\\n\"");
          return this.closer.block = 'end';
        } else {
          return this.opener = this.markInsertingCode(code, escape);
        }
      }
    };

    return Code;

  })(Node);

}).call(this);
