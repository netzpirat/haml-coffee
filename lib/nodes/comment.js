(function() {
  var Comment, Node, escapeQuotes,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Node = require('./node');

  escapeQuotes = require('../util/text').escapeQuotes;

  module.exports = Comment = (function(_super) {

    __extends(Comment, _super);

    function Comment() {
      return Comment.__super__.constructor.apply(this, arguments);
    }

    Comment.prototype.evaluate = function() {
      var comment, expression, identifier, _ref;
      _ref = this.expression.match(/(-#|\/\[|\/)\s?(.*)?/), expression = _ref[0], identifier = _ref[1], comment = _ref[2];
      switch (identifier) {
        case '-#':
          this.silent = true;
          return this.opener = this.markText('');
        case '\/[':
          this.opener = this.markText("<!--[" + comment + ">");
          return this.closer = this.markText('<![endif]-->');
        case '\/':
          if (comment) {
            this.opener = this.markText("<!-- " + (escapeQuotes(comment)));
            return this.closer = this.markText(' -->');
          } else {
            this.opener = this.markText("<!--");
            return this.closer = this.markText('-->');
          }
      }
    };

    return Comment;

  })(Node);

}).call(this);
