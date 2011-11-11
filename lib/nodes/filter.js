(function() {
  var Filter, Node;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Node = require('./node');

  module.exports = Filter = (function() {

    __extends(Filter, Node);

    function Filter() {
      Filter.__super__.constructor.apply(this, arguments);
    }

    Filter.prototype.evaluate = function() {
      var _ref;
      if (this.parentNode instanceof Filter) {
        this.contained = true;
        this.getFilterExpressionNode().addChild(this);
        return console.log("IM A CHILD NODE: " + this.expression + " AND WILL ATTACH TO " + this.parentNode.expression);
      } else {
        this.filter = (_ref = this.expression.match(/:(escaped|preserve|css|javascript|coffeescript|plain)(.*)?/)) != null ? _ref[1] : void 0;
        return console.log("IM A TOP LEVEL NODE: " + this.expression);
      }
    };

    Filter.prototype.render = function() {
      var child, output, plain, preserve, _i, _j, _k, _l, _len, _len2, _len3, _len4, _len5, _len6, _len7, _m, _n, _o, _ref, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;
      output = [];
      switch (this.filter) {
        case 'escaped':
          _ref = this.children;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            child = _ref[_i];
            output.push(this.markText(child.render(), true));
          }
          break;
        case 'preserve':
          preserve = '';
          _ref2 = this.children;
          for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
            child = _ref2[_j];
            preserve += "" + (child.render()) + "&#x000A;";
          }
          preserve = preserve.replace(/\&\#x000A;$/, '');
          output.push(this.markText(preserve));
          break;
        case 'plain':
          plain = '';
          _ref3 = this.children;
          for (_k = 0, _len3 = _ref3.length; _k < _len3; _k++) {
            child = _ref3[_k];
            plain += child.render();
          }
          output.push(this.markText(plain));
          break;
        case 'css':
          output.push(this.markText('<style type=\'text/css\'>'));
          output.push(this.markText('  /*<![CDATA[*/'));
          _ref4 = this.children;
          for (_l = 0, _len4 = _ref4.length; _l < _len4; _l++) {
            child = _ref4[_l];
            output.push(child.render());
          }
          output.push(this.markText('  /*]]>*/'));
          output.push(this.markText('</style>'));
          break;
        case 'javascript':
          output.push(this.markText('<script type=\'text/javascript\'>'));
          output.push(this.markText('  //<![CDATA['));
          _ref5 = this.children;
          for (_m = 0, _len5 = _ref5.length; _m < _len5; _m++) {
            child = _ref5[_m];
            output.push(child.render());
          }
          output.push(this.markText('  //]]>'));
          output.push(this.markText('</script>'));
          break;
        case 'cdata':
          output.push(this.markText('/*<![CDATA[*/'));
          _ref6 = this.children;
          for (_n = 0, _len6 = _ref6.length; _n < _len6; _n++) {
            child = _ref6[_n];
            output.push(child.render());
          }
          output.push(this.markText('/*]]>*/'));
          break;
        case 'coffeescript':
          _ref7 = this.children;
          for (_o = 0, _len7 = _ref7.length; _o < _len7; _o++) {
            child = _ref7[_o];
            output += child.render();
          }
          output = this.opener + '#{' + output + '}' + this.closer;
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
