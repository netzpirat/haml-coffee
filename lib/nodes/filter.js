(function() {
  var Filter, Node, e;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Node = require('./node');

  e = require('../helper').escapeHTML;

  module.exports = Filter = (function() {

    __extends(Filter, Node);

    function Filter() {
      Filter.__super__.constructor.apply(this, arguments);
    }

    Filter.prototype.evaluate = function() {
      if (this.parentNode instanceof Filter) {
        this.filter = this.parentNode.filter;
        return this.content = this.expression;
      } else {
        return this.filter = this.expression.match(/:(escaped|preserve|css|javascript|coffeescript|plain)(.*)?/)[1];
      }
    };

    Filter.prototype.render = function() {
      var cdata, child, css, js, output, _i, _j, _k, _l, _len, _len2, _len3, _len4, _len5, _len6, _len7, _m, _n, _o, _ref, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;
      output = '';
      if (this.parentNode instanceof Filter) {
        output = this.content;
      } else {
        switch (this.filter) {
          case 'escaped':
            _ref = this.children;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              child = _ref[_i];
              output += this.outputHtml(e(child.render()));
            }
            break;
          case 'preserve':
            _ref2 = this.children;
            for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
              child = _ref2[_j];
              output += "" + (child.render()) + "&#x000A;";
            }
            output = output.replace(/\&\#x000A;$/, '');
            output = this.outputHtml(output);
            break;
          case 'plain':
            _ref3 = this.children;
            for (_k = 0, _len3 = _ref3.length; _k < _len3; _k++) {
              child = _ref3[_k];
              output += child.render();
            }
            output = this.outputHtml(output);
            break;
          case 'css':
            output += this.outputHtml('<style type=\'text/css\'>');
            output += this.outputHtml('  /*<![CDATA[*/');
            _ref4 = this.children;
            for (_l = 0, _len4 = _ref4.length; _l < _len4; _l++) {
              child = _ref4[_l];
              css = child.render();
              if (!(css === '' && child === this.children[this.children.length - 1])) {
                output += this.outputHtml("    " + css);
              }
            }
            output += this.outputHtml('  /*]]>*/');
            output += this.outputHtml('</style>');
            break;
          case 'javascript':
            output += this.outputHtml('<script type=\'text/javascript\'>');
            output += this.outputHtml('  //<![CDATA[');
            _ref5 = this.children;
            for (_m = 0, _len5 = _ref5.length; _m < _len5; _m++) {
              child = _ref5[_m];
              js = child.render();
              if (!(js === '' && child === this.children[this.children.length - 1])) {
                output += this.outputHtml("    " + js);
              }
            }
            output += this.outputHtml('  //]]>');
            output += this.outputHtml('</script>');
            break;
          case 'cdata':
            output += this.outputHtml('/*<![CDATA[*/');
            _ref6 = this.children;
            for (_n = 0, _len6 = _ref6.length; _n < _len6; _n++) {
              child = _ref6[_n];
              cdata = child.render();
              if (!(cdata === '' && child === this.children[this.children.length - 1])) {
                output += this.outputHtml("  " + cdata);
              }
            }
            output += this.outputHtml('/*]]>*/');
            break;
          case 'coffeescript':
            _ref7 = this.children;
            for (_o = 0, _len7 = _ref7.length; _o < _len7; _o++) {
              child = _ref7[_o];
              output += child.render();
            }
            output = this.opener + '#{' + output + '}' + this.closer;
        }
      }
      return output;
    };

    Filter.prototype.getFilterExpressionNode = function() {
      if (this.parentNode instanceof Filter) {
        return this.parentNode.getFilterExpressionNode();
      } else {
        return this;
      }
    };

    return Filter;

  })();

}).call(this);
