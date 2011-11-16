(function() {
  var Code, Node, p;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Node = require('./node');

  p = require('../helper').preserve;

  module.exports = Code = (function() {

    __extends(Code, Node);

    function Code() {
      Code.__super__.constructor.apply(this, arguments);
    }

    Code.prototype.evaluate = function() {
      var code, codeBlock, identifier;
      codeBlock = this.expression.match(/(-|!=|\&=|=|~)\s?(.*)?/);
      identifier = codeBlock[1];
      code = codeBlock[2];
      if (identifier === '-') {
        this.opener = this.markRunningCode(code);
        if (this.children.length !== 0 && this.opener.code.match(/(->|=>)/)) {
          return this.closer = this.markRunningCode("  ''");
        }
      } else if (identifier === '~') {
        return this.opener = this.markInsertingCode(p(code));
      } else if (identifier === '&=' || (identifier === '=' && this.escapeHtml)) {
        return this.opener = this.markInsertingCode(code, true);
      } else if (identifier === '!=' || (identifier === '=' && !this.escapeHtml)) {
        return this.opener = this.markInsertingCode(code);
      }
    };

    return Code;

  })();

}).call(this);
