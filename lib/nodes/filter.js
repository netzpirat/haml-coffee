(function() {
  var Filter, Node, escapeHTML;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  Node = require('./node');
  escapeHTML = require('../helper').escapeHTML;
  module.exports = Filter = (function() {
    __extends(Filter, Node);
    function Filter() {
      Filter.__super__.constructor.apply(this, arguments);
    }
    Filter.prototype.evaluate = function() {
      var tokens;
      if (this.parent_node instanceof Filter) {
        this.filter = this.parent_node.filter;
        return this.content = this.expression;
      } else {
        tokens = this.expression.match(/:(escaped|preserve|css|javascript|coffeescript)(.*)?/);
        this.filter = tokens[1];
        this.content = tokens[2];
        switch (this.filter) {
          case 'escaped':
            this.opener = escapeHTML(this.content);
            return this.closer = '';
          case 'preserve':
          case 'plain':
            this.opener = '';
            return this.closer = '';
          case 'cdata':
            this.opener = '/*<![CDATA[*/' + this.content;
            return this.closer = '/*]]>*/';
          case 'css':
            this.opener = '<style type=\'text/css\'>\n  /*<![CDATA[*/' + this.content;
            return this.closer = '  /*]]>*/\n</script>';
          case 'javascript':
            this.opener = '<script type=\'text/javascript\'>\n  /*<![CDATA[*/' + this.content;
            return this.closer = '  /*]]>*/\n</script>';
          case 'coffeescript':
            this.opener = '<script type=\'text/javascript\'>\n  /*<![CDATA[*/#{' + this.content + '}';
            return this.closer = '  /*]]>*/\n</script>';
        }
      }
    };
    Filter.prototype.render = function() {
      var child, content, output, _i, _len, _ref;
      this.evaluateIfNecessary();
      output = '';
      if (this.parent_node instanceof Filter) {
        output = this.content;
      } else {
        _ref = this.children;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          child = _ref[_i];
          content = "" + (child.render());
        }
        switch (this.filter) {
          case 'escaped':
            output += escapeHTML(content);
            break;
          case 'preserve':
            output += content.replace("\n", '&#x000A;');
            break;
          case 'css':
          case 'javascript':
          case 'cdata':
          case 'plain':
            output += content;
            break;
          case 'coffeescript':
            output += '#{' + content + '}';
        }
        output = "" + this.cw + "o.push \"" + this.hw + output + "\"\n";
      }
      return output;
    };
    return Filter;
  })();
}).call(this);
