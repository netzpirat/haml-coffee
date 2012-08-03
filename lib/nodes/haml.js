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
          prefix = this.buildHtmlTagPrefix(tokens);
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
          prefix = this.buildHtmlTagPrefix(tokens);
          return this.opener = this.markText("" + prefix + (this.format === 'xhtml' ? ' /' : '') + ">");
        }
      }
    };

    Haml.prototype.parseExpression = function(exp) {
      var attributes, classes, id, key, tag, value, _ref, _ref1;
      tag = this.parseTag(exp);
      if (this.preserveTags.indexOf(tag.tag) !== -1) {
        this.preserve = true;
      }
      id = this.wrapCode((_ref = tag.ids) != null ? _ref.pop() : void 0, true);
      classes = tag.classes;
      attributes = {};
      if (tag.attributes) {
        _ref1 = tag.attributes;
        for (key in _ref1) {
          value = _ref1[key];
          if (key === 'id') {
            if (id) {
              id += '_' + this.wrapCode(value, true);
            } else {
              id = this.wrapCode(value, true);
            }
          } else if (key === 'class') {
            classes || (classes = []);
            classes.push(value);
          } else {
            attributes[key] = value;
          }
        }
      }
      return {
        doctype: tag.doctype,
        tag: tag.tag,
        id: id,
        classes: classes,
        text: escapeQuotes(tag.text),
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
              _results.push("'" + (id.substr(1)) + "'");
            }
            return _results;
          })() : void 0,
          classes: classes ? (function() {
            var _j, _len, _results;
            _results = [];
            for (_j = 0, _len = classes.length; _j < _len; _j++) {
              klass = classes[_j];
              _results.push("'" + (klass.substr(1)) + "'");
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
      var attributes, ch, endPos, hasDataAttribute, inDataAttribute, key, keyValue, keys, level, marker, markers, pairs, pos, quoted, start, startPos, type, value, _i, _j, _len, _ref, _ref1, _ref2;
      attributes = {};
      if (exp === void 0) {
        return attributes;
      }
      type = exp.substring(0, 1);
      exp = exp.replace(/(=|:|=>)\s*('([^\\']|\\\\|\\')*'|"([^\\"]|\\\\|\\")*")/g, function(match, type, value) {
        return type + (value != null ? value.replace(/(:|=|=>)/g, '\u0090$1') : void 0);
      });
      level = 0;
      start = 0;
      markers = [];
      if (type === '(') {
        startPos = 1;
        endPos = exp.length - 1;
      } else {
        startPos = 0;
        endPos = exp.length;
      }
      for (pos = _i = startPos; startPos <= endPos ? _i < endPos : _i > endPos; pos = startPos <= endPos ? ++_i : --_i) {
        ch = exp[pos];
        if (ch === '(') {
          level += 1;
          start = pos;
        }
        if (ch === ')') {
          if (level === 1) {
            if (start !== 0 && pos - start !== 1) {
              markers.push({
                start: start,
                end: pos
              });
            }
          } else {
            level -= 1;
          }
        }
      }
      _ref = markers.reverse();
      for (_j = 0, _len = _ref.length; _j < _len; _j++) {
        marker = _ref[_j];
        exp = exp.substring(0, marker.start) + exp.substring(marker.start, marker.end).replace(/(:|=|=>)/g, '\u0090$1') + exp.substring(marker.end);
      }
      switch (type) {
        case '(':
          keys = /\(\s*([-\w]+[\w:-]*\w?)\s*=|\s+([-\w]+[\w:-]*\w?)\s*=|\(\s*('\w+[\w:-]*\w?')\s*=|\s+('\w+[\w:-]*\w?')\s*=|\(\s*("\w+[\w:-]*\w?")\s*=|\s+("\w+[\w:-]*\w?")\s*=/g;
          break;
        case '{':
          keys = /[{,]\s*(\w+[\w:-]*\w?)\s*:|[{,]\s*('[-\w]+[\w:-]*\w?')\s*:|[{,]\s*("[-\w]+[\w:-]*\w?")\s*:|[{,]\s*:(\w+[\w:-]*\w?)\s*=>|[{,]\s*:?'([-\w]+[\w:-]*\w?)'\s*=>|[{,]\s*:?"([-\w]+[\w:-]*\w?)"\s*=>/g;
      }
      pairs = exp.split(keys).filter(Boolean);
      inDataAttribute = false;
      hasDataAttribute = false;
      while (pairs.length) {
        keyValue = pairs.splice(0, 2);
        key = (_ref1 = keyValue[0]) != null ? _ref1.replace(/^\s+|\s+$/g, '').replace(/^:/, '') : void 0;
        if (quoted = key.match(/^("|')(.*)\1$/)) {
          key = quoted[2];
        }
        value = (_ref2 = keyValue[1]) != null ? _ref2.replace(/^\s+|[\s,]+$/g, '').replace(/\u0090/g, '') : void 0;
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
      var classList, classes, hasDynamicClass, key, klass, name, tagParts, value, _i, _len, _ref;
      tagParts = ["<" + tokens.tag];
      if (tokens.classes) {
        hasDynamicClass = false;
        classList = (function() {
          var _i, _len, _ref, _results;
          _ref = tokens.classes;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            name = _ref[_i];
            name = this.wrapCode(name, true);
            if (name.indexOf('#{') !== -1) {
              hasDynamicClass = true;
            }
            _results.push(name);
          }
          return _results;
        }).call(this);
        if (hasDynamicClass && classList.length > 1) {
          classes = '#{ [';
          for (_i = 0, _len = classList.length; _i < _len; _i++) {
            klass = classList[_i];
            classes += "" + (this.quoteAndEscapeAttributeValue(klass, true)) + ",";
          }
          classes = classes.substring(0, classes.length - 1) + '].sort().join(\' \').trim() }';
        } else {
          classes = classList.sort().join(' ');
        }
        tagParts.push("class='" + classes + "'");
      }
      if (tokens.id) {
        tagParts.push("id='" + tokens.id + "'");
      }
      if (tokens.attributes) {
        _ref = tokens.attributes;
        for (key in _ref) {
          value = _ref[key];
          if (value === 'true' || value === 'false') {
            if (value === 'true') {
              if (this.format === 'html5') {
                tagParts.push("" + key);
              } else {
                tagParts.push("" + key + "=" + (this.quoteAndEscapeAttributeValue(key)));
              }
            }
          } else {
            tagParts.push("" + key + "=" + (this.quoteAndEscapeAttributeValue(this.wrapCode(value))));
          }
        }
      }
      return tagParts.join(' ');
    };

    Haml.prototype.wrapCode = function(text, unwrap) {
      var quoted;
      if (unwrap == null) {
        unwrap = false;
      }
      if (!text) {
        return;
      }
      if (!text.match(/^("|').*\1$/)) {
        if (this.escapeAttributes) {
          if (this.cleanValue) {
            text = '#{ $e($c(' + text + ')) }';
          } else {
            text = '#{ $e(' + text + ') }';
          }
        } else {
          if (this.cleanValue) {
            text = '#{ $c(' + text + ') }';
          } else {
            text = '#{ (' + text + ') }';
          }
        }
      }
      if (unwrap) {
        if (quoted = text.match(/^("|')(.*)\1$/)) {
          text = quoted[2];
        }
      }
      return text;
    };

    Haml.prototype.quoteAndEscapeAttributeValue = function(value, code) {
      var escaped, hasDoubleQuotes, hasInterpolation, hasSingleQuotes, quoted, result, token, tokens, _i, _len;
      if (code == null) {
        code = false;
      }
      if (!value) {
        return;
      }
      if (quoted = value.match(/^("|')(.*)\1$/)) {
        value = quoted[2];
      }
      tokens = this.splitInterpolations(value);
      hasSingleQuotes = false;
      hasDoubleQuotes = false;
      hasInterpolation = false;
      for (_i = 0, _len = tokens.length; _i < _len; _i++) {
        token = tokens[_i];
        if (token.slice(0, 2) === '#{') {
          hasInterpolation = true;
        } else {
          if (!hasSingleQuotes) {
            hasSingleQuotes = token.indexOf("'") !== -1;
          }
          if (!hasDoubleQuotes) {
            hasDoubleQuotes = token.indexOf('"') !== -1;
          }
        }
      }
      if (code) {
        if (hasInterpolation) {
          result = "\"" + (tokens.join('')) + "\"";
        } else {
          result = "'" + (tokens.join('')) + "'";
        }
      } else {
        if (!hasDoubleQuotes && !hasSingleQuotes) {
          result = "'" + (tokens.join('')) + "'";
        }
        if (hasSingleQuotes && !hasDoubleQuotes) {
          result = "\\\"" + (tokens.join('')) + "\\\"";
        }
        if (hasDoubleQuotes && !hasSingleQuotes) {
          escaped = (function() {
            var _j, _len1, _results;
            _results = [];
            for (_j = 0, _len1 = tokens.length; _j < _len1; _j++) {
              token = tokens[_j];
              _results.push(escapeQuotes(token));
            }
            return _results;
          })();
          result = "'" + (escaped.join('')) + "'";
        }
        if (hasSingleQuotes && hasDoubleQuotes) {
          escaped = (function() {
            var _j, _len1, _results;
            _results = [];
            for (_j = 0, _len1 = tokens.length; _j < _len1; _j++) {
              token = tokens[_j];
              _results.push(escapeQuotes(token).replace(/'/g, '&#39;'));
            }
            return _results;
          })();
          result = "'" + (escaped.join('')) + "'";
        }
      }
      return result;
    };

    Haml.prototype.splitInterpolations = function(value) {
      var ch, ch2, level, pos, quoted, start, tokens, _i, _ref;
      level = 0;
      start = 0;
      tokens = [];
      quoted = false;
      for (pos = _i = 0, _ref = value.length; 0 <= _ref ? _i < _ref : _i > _ref; pos = 0 <= _ref ? ++_i : --_i) {
        ch = value[pos];
        ch2 = value.slice(pos, (pos + 1) + 1 || 9e9);
        if (ch === '{') {
          level += 1;
        }
        if (ch2 === '#{' && level === 0) {
          tokens.push(value.slice(start, pos));
          start = pos;
        }
        if (ch === '}') {
          level -= 1;
          if (level === 0) {
            tokens.push(value.slice(start, pos + 1 || 9e9));
            start = pos + 1;
          }
        }
      }
      tokens.push(value.slice(start, value.length));
      return tokens.filter(Boolean);
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
