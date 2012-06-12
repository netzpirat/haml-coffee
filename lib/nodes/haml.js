(function() {
  var Haml, Node, escapeQuotes,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Node = require('./node');

  escapeQuotes = require('../util/text').escapeQuotes;

  module.exports = Haml = (function(_super) {

    __extends(Haml, _super);

    function Haml() {
      return Haml.__super__.constructor.apply(this, arguments);
    }

    Haml.prototype.evaluate = function() {
      var assignment, code, identifier, match, prefix, tokens;
      tokens = this.parseExpression(this.expression);
      if (tokens.doctype) {
        return this.opener = this.markText("" + (escapeQuotes(this.buildDocType(tokens.doctype))));
      } else {
        if (this.isNotSelfClosing(tokens.tag)) {
          prefix = escapeQuotes(this.buildHtmlTagPrefix(tokens));
          if (tokens.assignment) {
            match = tokens.assignment.match(/^(=|!=|&=|~)\s*(.*)$/);
            identifier = match[1];
            assignment = match[2];
            if (identifier === '~') {
              code = "\#{$fp " + assignment + " }";
            } else if (identifier === '&=' || (identifier === '=' && this.escapeHtml)) {
              if (this.preserve) {
                if (this.cleanValue) {
                  code = "\#{ $p($e($c(" + assignment + "))) }";
                } else {
                  code = "\#{ $p($e(" + assignment + ")) }";
                }
              } else {
                if (this.cleanValue) {
                  code = "\#{ $e($c(" + assignment + ")) }";
                } else {
                  code = "\#{ $e(" + assignment + ") }";
                }
              }
            } else if (identifier === '!=' || (identifier === '=' && !this.escapeHtml)) {
              if (this.preserve) {
                if (this.cleanValue) {
                  code = "\#{ $p($c(" + assignment + ")) }";
                } else {
                  code = "\#{ $p(" + assignment + ") }";
                }
              } else {
                if (this.cleanValue) {
                  code = "\#{ $c(" + assignment + ") }";
                } else {
                  code = "\#{ " + assignment + " }";
                }
              }
            }
            this.opener = this.markText("" + prefix + ">" + code);
            return this.closer = this.markText("</" + tokens.tag + ">");
          } else if (tokens.text) {
            this.opener = this.markText("" + prefix + ">" + tokens.text);
            return this.closer = this.markText("</" + tokens.tag + ">");
          } else {
            this.opener = this.markText(prefix + '>');
            return this.closer = this.markText("</" + tokens.tag + ">");
          }
        } else {
          tokens.tag = tokens.tag.replace(/\/$/, '');
          prefix = escapeQuotes(this.buildHtmlTagPrefix(tokens));
          return this.opener = this.markText("" + prefix + (this.format === 'xhtml' ? ' /' : '') + ">");
        }
      }
    };

    Haml.prototype.parseExpression = function(exp) {
      var attribute, attributes, classes, id, tag, _i, _len, _ref, _ref1;
      tag = this.parseTag(exp);
      if (this.preserveTags.indexOf(tag.tag) !== -1) {
        this.preserve = true;
      }
      id = (_ref = tag.ids) != null ? _ref.pop() : void 0;
      classes = tag.classes;
      attributes = [];
      if (tag.attributes) {
        _ref1 = tag.attributes;
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          attribute = _ref1[_i];
          if (attribute.key === 'id') {
            if (id) {
              id += '_' + attribute.value;
            } else {
              id = attribute.value;
            }
          } else if (attribute.key === 'class') {
            classes || (classes = []);
            classes.push(attribute.value);
          } else {
            attributes.push(attribute);
          }
        }
      }
      return {
        doctype: tag.doctype,
        tag: tag.tag,
        id: id,
        classes: classes,
        text: tag.text,
        attributes: attributes,
        assignment: tag.assignment
      };
    };

    Haml.prototype.parseTag = function(exp) {
      var assignment, attributes, ch, classes, doctype, end, haml, id, ids, klass, level, pos, rest, start, tag, text, whitespace, _i, _ref, _ref1, _ref2;
      try {
        doctype = (_ref = exp.match(/^(\!{3}.*)/)) != null ? _ref[1] : void 0;
        if (doctype) {
          return {
            doctype: doctype
          };
        }
        haml = exp.match(/^((?:[#%\.][a-z0-9_:\-]*[\/]?)+)/i)[0];
        rest = exp.substring(haml.length);
        if (rest.match(/^[{(]/)) {
          start = rest[0];
          end = (function() {
            switch (start) {
              case '{':
                return '}';
              case '(':
                return ')';
            }
          })();
          level = 0;
          for (pos = _i = 0, _ref1 = rest.length; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; pos = 0 <= _ref1 ? ++_i : --_i) {
            ch = rest[pos];
            if (ch === start) {
              level += 1;
            }
            if (ch === end) {
              if (level === 1) {
                break;
              } else {
                level -= 1;
              }
            }
          }
          attributes = rest.substring(0, pos + 1);
          assignment = rest.substring(pos + 1);
        } else {
          attributes = '';
          assignment = rest;
        }
        if (whitespace = (_ref2 = assignment.match(/^[<>]{0,2}/)) != null ? _ref2[0] : void 0) {
          assignment = assignment.substring(whitespace.length);
        }
        if (assignment[0] === ' ') {
          assignment = assignment.substring(1);
        }
        if (assignment && !assignment.match(/^(=|!=|&=|~)/)) {
          text = assignment.replace(/^ /, '');
          assignment = void 0;
        }
        if (whitespace) {
          if (whitespace.indexOf('>') !== -1) {
            this.wsRemoval.around = true;
          }
          if (whitespace.indexOf('<') !== -1) {
            this.wsRemoval.inside = true;
            this.preserve = true;
          }
        }
        tag = haml.match(/\%([a-z_\-][a-z0-9_:\-]*[\/]?)/i);
        ids = haml.match(/\#([a-z_\-][a-z0-9_\-]*)/gi);
        classes = haml.match(/\.([a-z0-9_\-]*)/gi);
        return {
          tag: tag ? tag[1] : 'div',
          ids: ids ? (function() {
            var _j, _len, _results;
            _results = [];
            for (_j = 0, _len = ids.length; _j < _len; _j++) {
              id = ids[_j];
              _results.push(id.substr(1));
            }
            return _results;
          })() : void 0,
          classes: classes ? (function() {
            var _j, _len, _results;
            _results = [];
            for (_j = 0, _len = classes.length; _j < _len; _j++) {
              klass = classes[_j];
              _results.push(klass.substr(1));
            }
            return _results;
          })() : void 0,
          attributes: this.parseAttributes(attributes),
          assignment: assignment,
          text: text
        };
      } catch (error) {
        throw "Unable to parse tag from " + exp + ": " + error;
      }
    };

    Haml.prototype.parseAttributes = function(exp) {
      var attributes, bool, key, quoted, value, _ref;
      attributes = [];
      if (exp === void 0) {
        return attributes;
      }
      _ref = this.extractAttributes(exp);
      for (key in _ref) {
        value = _ref[key];
        bool = false;
        if (value === 'true' || value === 'false') {
          bool = true;
        } else if (!value.match(/^("|').*\1$/)) {
          if (this.escapeAttributes) {
            if (this.cleanValue) {
              value = '\'#{ $e($c(' + value + ')) }\'';
            } else {
              value = '\'#{ $e(' + value + ') }\'';
            }
          } else {
            if (this.cleanValue) {
              value = '\'#{ $c(' + value + ') }\'';
            } else {
              value = '\'#{ (' + value + ') }\'';
            }
          }
        }
        if (quoted = value.match(/^("|')(.*)\1$/)) {
          value = quoted[2];
        }
        if (quoted = key.match(/^("|')(.*)\1$/)) {
          key = quoted[2];
        }
        attributes.push({
          key: key,
          value: value,
          bool: bool
        });
      }
      return attributes;
    };

    Haml.prototype.extractAttributes = function(exp) {
      var attributes, hasDataAttribute, inDataAttribute, key, keyValue, keys, pairs, quoted, type, value, _ref, _ref1;
      attributes = {};
      type = exp.substring(0, 1);
      exp = exp.replace(/(=|:|=>)\s*('([^\\']|\\\\|\\')*'|"([^\\"]|\\\\|\\")*")/g, function(match, type, value) {
        return type + (value != null ? value.replace(/(:|=|=>)/, '\u0090$1') : void 0);
      });
      switch (type) {
        case '(':
          keys = /\(\s*([-\w]+[\w:-]*\w?)\s*=|\s+([-\w]+[\w:-]*\w?)\s*=|\(\s*('\w+[\w:-]*\w?')\s*=|\s+('\w+[\w:-]*\w?')\s*=|\(\s*("\w+[\w:-]*\w?")\s*=|\s+("\w+[\w:-]*\w?")\s*=/g;
          break;
        case '{':
          keys = /[{,]\s*(\w+[\w:-]*\w?):|[{,]\s*('[-\w]+[\w:-]*\w?'):|[{,]\s*("[-\w]+[\w:-]*\w?"):|[{,]\s*:(\w+[\w:-]*\w?)\s*=>|[{,]\s*:?'([-\w]+[\w:-]*\w?)'\s*=>|[{,]\s*:?"([-\w]+[\w:-]*\w?)"\s*=>/g;
      }
      pairs = exp.split(keys).filter(Boolean);
      inDataAttribute = false;
      hasDataAttribute = false;
      while (pairs.length) {
        keyValue = pairs.splice(0, 2);
        key = (_ref = keyValue[0]) != null ? _ref.replace(/^\s+|\s+$/g, '').replace(/^:/, '') : void 0;
        if (quoted = key.match(/^("|')(.*)\1$/)) {
          key = quoted[2];
        }
        value = (_ref1 = keyValue[1]) != null ? _ref1.replace(/^\s+|[\s,]+$/g, '').replace(/\u0090/, '') : void 0;
        if (key === 'data') {
          inDataAttribute = true;
          hasDataAttribute = true;
        } else if (key && value) {
          if (inDataAttribute) {
            key = "data-" + key;
            if (/}\s*$/.test(value)) {
              inDataAttribute = false;
            }
          }
        }
        switch (type) {
          case '(':
            attributes[key] = value.replace(/^\s+|[\s)]+$/g, '');
            break;
          case '{':
            attributes[key] = value.replace(/^\s+|[\s}]+$/g, '');
        }
      }
      if (hasDataAttribute) {
        delete attributes['data'];
      }
      return attributes;
    };

    Haml.prototype.buildHtmlTagPrefix = function(tokens) {
      var attribute, classes, interpolation, klass, tagParts, _i, _j, _len, _len1, _ref, _ref1;
      tagParts = ["<" + tokens.tag];
      if (tokens.classes) {
        classes = tokens.classes.sort().join(' ');
        if (tokens.classes.length > 1 && classes.match(/#\{/)) {
          classes = '#{ [';
          _ref = tokens.classes;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            klass = _ref[_i];
            if (interpolation = klass.match(/^#{(.*)}$/)) {
              classes += "(" + interpolation[1] + "),";
            } else if (interpolation = klass.match(/#{(.*)}/)) {
              classes += "\\\"" + klass + "\\\"";
            } else {
              classes += "'" + klass + "',";
            }
          }
          classes += '].sort().join(\' \') }';
        }
        tagParts.push("class='" + classes + "'");
      }
      if (tokens.id) {
        tagParts.push("id='" + tokens.id + "'");
      }
      if (tokens.attributes) {
        _ref1 = tokens.attributes;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          attribute = _ref1[_j];
          if (attribute.bool) {
            if (attribute.value === 'true') {
              if (this.format === 'html5') {
                tagParts.push("" + attribute.key);
              } else {
                tagParts.push("" + attribute.key + "=" + (this.quoteAttributeValue(attribute.key)));
              }
            }
          } else {
            tagParts.push("" + attribute.key + "=" + (this.quoteAttributeValue(attribute.value)));
          }
        }
      }
      return tagParts.join(' ');
    };

    Haml.prototype.quoteAttributeValue = function(value) {
      var quoted;
      if (value.indexOf("'") === -1) {
        quoted = "'" + value + "'";
      } else {
        quoted = "\"" + value + "\"";
      }
      return quoted;
    };

    Haml.prototype.buildDocType = function(doctype) {
      switch ("" + this.format + " " + doctype) {
        case 'xhtml !!! XML':
          return '<?xml version=\'1.0\' encoding=\'utf-8\' ?>';
        case 'xhtml !!!':
          return '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">';
        case 'xhtml !!! 1.1':
          return '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">';
        case 'xhtml !!! mobile':
          return '<!DOCTYPE html PUBLIC "-//WAPFORUM//DTD XHTML Mobile 1.2//EN" "http://www.openmobilealliance.org/tech/DTD/xhtml-mobile12.dtd">';
        case 'xhtml !!! basic':
          return '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML Basic 1.1//EN" "http://www.w3.org/TR/xhtml-basic/xhtml-basic11.dtd">';
        case 'xhtml !!! frameset':
          return '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Frameset//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-frameset.dtd">';
        case 'xhtml !!! 5':
        case 'html5 !!!':
          return '<!DOCTYPE html>';
        case 'html5 !!! XML':
        case 'html4 !!! XML':
          return '';
        case 'html4 !!!':
          return '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">';
        case 'html4 !!! frameset':
          return '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Frameset//EN" "http://www.w3.org/TR/html4/frameset.dtd">';
        case 'html4 !!! strict':
          return '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">';
      }
    };

    Haml.prototype.isNotSelfClosing = function(tag) {
      return this.selfCloseTags.indexOf(tag) === -1 && !tag.match(/\/$/);
    };

    return Haml;

  })(Node);

}).call(this);
