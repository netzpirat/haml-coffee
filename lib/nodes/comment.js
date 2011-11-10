(function() {
  var Comment, Node;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Node = require('./node');

  module.exports = Comment = (function() {

    __extends(Comment, Node);

    function Comment() {
      Comment.__super__.constructor.apply(this, arguments);
    }

    Comment.prototype.evaluate = function() {
      var comment, expression, identifier, _ref;
      _ref = this.expression.match(/(-#|\/\[|\/)\s?(.*)?/), expression = _ref[0], identifier = _ref[1], comment = _ref[2];
      switch (identifier) {
        case '-#':
          this.silent = true;
          return this.opener = '';
        case '\/[':
          this.opener = "<!--[" + comment + ">";
          return this.closer = '<![endif]-->';
        case '\/':
          if (comment) {
            this.opener = "<!-- " + comment;
            return this.closer = ' -->';
          } else {
            this.opener = "<!--";
            return this.closer = '-->';
          }
      }
    };

    return Comment;

  })();

}).call(this);
