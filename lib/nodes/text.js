(function() {
  var Node, Text, escapeQuotes,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Node = require('./node');

  escapeQuotes = require('../util/text').escapeQuotes;

  module.exports = Text = (function(_super) {

    __extends(Text, _super);

    function Text() {
      return Text.__super__.constructor.apply(this, arguments);
    }

    Text.prototype.evaluate = function() {
      return this.opener = this.markText(escapeQuotes(this.expression));
    };

    return Text;

  })(Node);

}).call(this);
