(function() {
  var Filter, Node, w;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Node = require('./node');

  w = require('../helper').whitespace;

  module.exports = Filter = (function() {

    __extends(Filter, Node);

    function Filter() {
      Filter.__super__.constructor.apply(this, arguments);
    }

    Filter.prototype.evaluate = function() {
      var _ref;
      return this.filter = (_ref = this.expression.match(/:(escaped|preserve|css|javascript|coffeescript|plain|cdata|coffeescript)(.*)?/)) != null ? _ref[1] : void 0;
    };

    Filter.prototype.render = function() {
      var child, indent, output, preserve, _i, _j, _len, _len2, _ref, _ref2;
      output = [];
      switch (this.filter) {
        case 'escaped':
          _ref = this.children;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            child = _ref[_i];
            output.push(this.markText(child.render()[0].text, true));
          }
          break;
        case 'preserve':
          preserve = '';
          _ref2 = this.children;
          for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
            child = _ref2[_j];
            preserve += "" + (child.render()[0].text) + "&#x000A;";
          }
          preserve = preserve.replace(/\&\#x000A;$/, '');
          output.push(this.markText(preserve));
          break;
        case 'plain':
          this.renderFilterContent(0, output);
          break;
        case 'css':
          if (this.format === 'html5') {
            output.push(this.markText('<style>'));
          } else {
            output.push(this.markText('<style type=\'text/css\'>'));
          }
          if (this.format === 'xhtml') {
            output.push(this.markText('  /*<![CDATA[*/'));
          }
          indent = this.format === 'xhtml' ? 2 : 1;
          this.renderFilterContent(indent, output);
          if (this.format === 'xhtml') output.push(this.markText('  /*]]>*/'));
          output.push(this.markText('</style>'));
          break;
        case 'javascript':
          if (this.format === 'html5') {
            output.push(this.markText('<script>'));
          } else {
            output.push(this.markText('<script type=\'text/javascript\'>'));
          }
          if (this.format === 'xhtml') output.push(this.markText('  //<![CDATA['));
          indent = this.format === 'xhtml' ? 2 : 1;
          this.renderFilterContent(indent, output);
          if (this.format === 'xhtml') output.push(this.markText('  //]]>'));
          output.push(this.markText('</script>'));
          break;
        case 'cdata':
          output.push(this.markText('<![CDATA['));
          this.renderFilterContent(2, output);
          output.push(this.markText(']]>'));
          break;
        case 'coffeescript':
          this.renderFilterContent(0, output, 'run');
      }
      return output;
    };

    Filter.prototype.renderFilterContent = function(indent, output, type) {
      var child, content, e, empty, line, _i, _j, _len, _len2, _ref, _results;
      if (type == null) type = 'text';
      content = [];
      empty = 0;
      _ref = this.children;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        child = _ref[_i];
        content.push(child.render()[0].text);
      }
      _results = [];
      for (_j = 0, _len2 = content.length; _j < _len2; _j++) {
        line = content[_j];
        if (line === '') {
          _results.push(empty += 1);
        } else {
          switch (type) {
            case 'text':
              for (e = 0; 0 <= empty ? e < empty : e > empty; 0 <= empty ? e++ : e--) {
                output.push(this.markText(""));
              }
              output.push(this.markText("" + (w(indent)) + line));
              break;
            case 'run':
              output.push(this.markRunningCode("" + line));
          }
          _results.push(empty = 0);
        }
      }
      return _results;
    };

    return Filter;

  })();

}).call(this);
