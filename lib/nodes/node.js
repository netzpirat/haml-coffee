(function() {
  var Node, escapeHTML;

  escapeHTML = require('../util/text').escapeHTML;

  module.exports = Node = (function() {

    Node.CLEAR_WHITESPACE_LEFT = '\u0091';

    Node.CLEAR_WHITESPACE_RIGHT = '\u0092';

    function Node(expression, options) {
      this.expression = expression != null ? expression : '';
      if (options == null) {
        options = {};
      }
      this.parentNode = options.parentNode;
      this.children = [];
      this.opener = this.closer = null;
      this.silent = false;
      this.preserveTags = options.preserveTags.split(',');
      this.preserve = false;
      this.wsRemoval = {
        around: false,
        inside: false
      };
      this.escapeHtml = options.escapeHtml;
      this.escapeAttributes = options.escapeAttributes;
      this.cleanValue = options.cleanValue;
      this.format = options.format;
      this.selfCloseTags = options.selfCloseTags.split(',');
      this.uglify = options.uglify;
      this.codeBlockLevel = options.codeBlockLevel;
      this.blockLevel = options.blockLevel;
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
      if (this.preserve) {
        return true;
      }
      if (this.parentNode) {
        return this.parentNode.isPreserved();
      } else {
        return false;
      }
    };

    Node.prototype.isCommented = function() {
      if (this.constructor.name === 'Comment') {
        return true;
      }
      if (this.parentNode) {
        return this.parentNode.isCommented();
      } else {
        return false;
      }
    };

    Node.prototype.markText = function(text, escape) {
      if (escape == null) {
        escape = false;
      }
      return {
        type: 'text',
        cw: this.codeBlockLevel,
        hw: this.uglify ? 0 : this.blockLevel - this.codeBlockLevel,
        text: escape ? escapeHTML(text) : text
      };
    };

    Node.prototype.markRunningCode = function(code) {
      return {
        type: 'run',
        cw: this.codeBlockLevel,
        code: code
      };
    };

    Node.prototype.markInsertingCode = function(code, escape, preserve, findAndPreserve) {
      if (escape == null) {
        escape = false;
      }
      if (preserve == null) {
        preserve = false;
      }
      if (findAndPreserve == null) {
        findAndPreserve = false;
      }
      return {
        type: 'insert',
        cw: this.codeBlockLevel,
        hw: this.uglify ? 0 : this.blockLevel - this.codeBlockLevel,
        escape: escape,
        preserve: preserve,
        findAndPreserve: findAndPreserve,
        code: code
      };
    };

    Node.prototype.evaluate = function() {};

    Node.prototype.render = function() {
      var child, output, rendered, tag, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _ref, _ref1, _ref2, _ref3, _ref4;
      output = [];
      if (this.silent) {
        return output;
      }
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
            this.wsRemoval.inside = true;
            output.push(this.getOpener());
            _ref = this.children;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              child = _ref[_i];
              _ref1 = child.render();
              for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
                rendered = _ref1[_j];
                rendered.hw = this.blockLevel;
                output.push(rendered);
              }
            }
            output.push(this.getCloser());
          } else {
            output.push(this.getOpener());
            _ref2 = this.children;
            for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
              child = _ref2[_k];
              output = output.concat(child.render());
            }
            output.push(this.getCloser());
          }
        } else if (this.opener) {
          output.push(this.getOpener());
          _ref3 = this.children;
          for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
            child = _ref3[_l];
            output = output.concat(child.render());
          }
        } else {
          _ref4 = this.children;
          for (_m = 0, _len4 = _ref4.length; _m < _len4; _m++) {
            child = _ref4[_m];
            output.push(this.markText(child.render().text));
          }
        }
      }
      return output;
    };

    return Node;

  })();

}).call(this);
