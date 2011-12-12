(function() {
  var Node, Text, escapeQuotes;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Node = require('./node');

  escapeQuotes = require('../util/text').escapeQuotes;

  module.exports = Text = (function() {

    __extends(Text, Node);

    function Text() {
      Text.__super__.constructor.apply(this, arguments);
    }

    Text.prototype.evaluate = function() {
      return this.opener = this.markText(escapeQuotes(this.expression));
    };

    return Text;

  })();

}).call(this);
