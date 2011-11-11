(function() {
  var Code, Node;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Node = require('./node');

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
        return this.opener = this.markRunningCode(code);
      } else if (identifier === '~') {
        return this.opener = this.markInsertingCode(this.findAndPreserve(code));
      } else if (identifier === '&=' || (identifier === '=' && this.escapeHtml)) {
        return this.opener = this.markInsertingCode(code, true);
      } else if (identifier === '!=' || (identifier === '=' && !this.escapeHtml)) {
        return this.opener = this.markInsertingCode(code);
      }
    };

    Code.prototype.findAndPreserve = function(code) {
      return code.replace(/<(pre|textarea)>(.*?)<\/\1>/g, function(text) {
        return text.replace('\\n', '\&\#x000A;');
      });
    };

    return Code;

  })();

}).call(this);
