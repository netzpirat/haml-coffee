(function() {
  var Node, e;

  e = require('../helper').escapeHTML;

  module.exports = Node = (function() {

    Node.CLEAR_WHITESPACE_LEFT = '\u0091';

    Node.CLEAR_WHITESPACE_RIGHT = '\u0092';

    function Node(expression, options) {
      this.expression = expression != null ? expression : '';
      if (options == null) options = {};
      this.parentNode = options.parentNode;
      this.children = [];
      this.opener = this.closer = null;
      this.silent = false;
      this.preserve = false;
      this.wsRemoval = {
        around: false,
        inside: false
      };
      this.escapeHtml = options.escapeHtml;
      this.escapeAttributes = options.escapeAttributes;
      this.format = options.format;
      this.codeBlockLevel = options.codeBlockLevel;
      this.blockLevel = options.blockLevel;
      this.evaluate();
    }

    Node.prototype.addChild = function(child) {
      this.children.push(child);
      return this;
    };

    Node.prototype.getOpener = function() {
      if (this.wsRemoval.around && this.opener.text) {
        this.opener.text = Node.CLEAR_WHITESPACE_LEFT + this.opener.text;
      }
      if (this.wsRemoval.inside && this.opener.text) {
        this.opener.text += Node.CLEAR_WHITESPACE_RIGHT;
      }
      return this.opener;
    };

    Node.prototype.getCloser = function() {
      if (this.wsRemoval.inside && this.closer.text) {
        this.closer.text = Node.CLEAR_WHITESPACE_LEFT + this.closer.text;
      }
      if (this.wsRemoval.around && this.closer.text) {
        this.closer.text += Node.CLEAR_WHITESPACE_RIGHT;
      }
      return this.closer;
    };

    Node.prototype.isPreserved = function() {
      if (this.preserve) return true;
      if (this.parentNode) {
        return this.parentNode.isPreserved();
      } else {
        return false;
      }
    };

    Node.prototype.getHtmlIndention = function() {
      if (this.isPreserved()) {
        return 0;
      } else {
        return this.blockLevel;
      }
    };

    Node.prototype.markText = function(text, escape) {
      if (escape == null) escape = false;
      return {
        type: 'text',
        cw: this.codeBlockLevel,
        hw: this.getHtmlIndention(),
        text: escape ? e(text) : text != null ? text.replace(/"/g, '\\\"') : void 0
      };
    };

    Node.prototype.markRunningCode = function(code) {
      return {
        type: 'run',
        cw: this.codeBlockLevel,
        code: code
      };
    };

    Node.prototype.markInsertingCode = function(code, escape) {
      if (escape == null) escape = false;
      return {
        type: 'insert',
        cw: this.codeBlockLevel,
        hw: this.getHtmlIndention(),
        escape: escape,
        code: code
      };
    };

    Node.prototype.evaluate = function() {};

    Node.prototype.render = function() {
      var child, output, preserve, tag, _i, _j, _k, _len, _len2, _len3, _ref, _ref2, _ref3;
      output = [];
      if (this.silent) return output;
      if (this.children.length === 0) {
        if (this.opener && this.closer) {
          tag = this.getOpener();
          tag.text += this.getCloser().text;
          output.push(tag);
        } else {
          if (!this.preserve && this.isPreserved()) {
            output.push(this.getOpener());
          } else {
            output.push(this.getOpener());
          }
        }
      } else {
        if (this.opener && this.closer) {
          if (this.preserve) {
            preserve = this.getOpener().text;
            _ref = this.children;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              child = _ref[_i];
              preserve += "" + (child.render()[0].text) + "\\n";
            }
            preserve = preserve.replace(/\\n$/, '');
            preserve += this.getCloser().text;
            output.push(this.markText(preserve));
          } else {
            output.push(this.getOpener());
            _ref2 = this.children;
            for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
              child = _ref2[_j];
              output = output.concat(child.render());
            }
            output.push(this.getCloser());
          }
        } else {
          _ref3 = this.children;
          for (_k = 0, _len3 = _ref3.length; _k < _len3; _k++) {
            child = _ref3[_k];
            output.push(this.markText(child.render().text));
          }
        }
      }
      return output;
    };

    return Node;

  })();

}).call(this);
