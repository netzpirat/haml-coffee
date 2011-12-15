(function() {
  var Haml, Node, escapeQuotes;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Node = require('./node');

  escapeQuotes = require('../util/text').escapeQuotes;

  module.exports = Haml = (function() {

    __extends(Haml, Node);

    function Haml() {
      Haml.__super__.constructor.apply(this, arguments);
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
      var attribute, attributes, classes, id, tag, _i, _len, _ref, _ref2;
      tag = this.parseTag(exp);
      if (this.preserveTags.indexOf(tag.tag) !== -1) this.preserve = true;
      id = (_ref = tag.ids) != null ? _ref.pop() : void 0;
      classes = tag.classes;
      attributes = [];
      if (tag.attributes) {
        _ref2 = tag.attributes;
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          attribute = _ref2[_i];
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
      var assignment, attributes, classes, doctype, haml, id, ids, klass, tag, text, tokens, whitespace, _ref;
      try {
        doctype = (_ref = exp.match(/^(\!{3}.*)/)) != null ? _ref[1] : void 0;
        if (doctype) {
          return {
            doctype: doctype
          };
        }
        tokens = exp.match(/^((?:[#%\.][a-z0-9_:\-]*[\/]?)+)(?:([\(\{].*[\)\}])?([\<\>]{0,2})(?=[=&!~])(.*)?|([\(\{].*[\)\}])?([\<\>]{0,2}))(.*)?/i);
        haml = tokens[1];
        attributes = tokens[2] || tokens[5];
        whitespace = tokens[3] || tokens[6];
        assignment = tokens[4] || tokens[7];
        if (assignment && !assignment.match(/^(=|!=|&=|~)/)) {
          text = assignment.replace(/^ /, '');
          assignment = void 0;
        }
        if (whitespace) {
          if (whitespace.indexOf('>') !== -1) this.wsRemoval.around = true;
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
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = ids.length; _i < _len; _i++) {
              id = ids[_i];
              _results.push(id.substr(1));
            }
            return _results;
          })() : void 0,
          classes: classes ? (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = classes.length; _i < _len; _i++) {
              klass = classes[_i];
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
      var attributes, bool, datas, findAttributes, key, match, quoted, value, _ref;
      attributes = [];
      if (exp === void 0) return attributes;
      _ref = this.getDataAttributes(exp), exp = _ref[0], datas = _ref[1];
      findAttributes = /(?:(\w+[\w:-]*\w?|'\w+[\w:-]*\w?'|"\w+[\w:-]*\w?")\s*=\s*("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[\w@.]+)|(:\w+[\w:-]*\w?|'\w+[\w:-]*\w?'|"\w+[\w:-]*\w?")\s*=>\s*("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[-\w@.()\[\]'"]+)|(\w+[\w:-]*\w?|'\w+[\w:-]*\w?'|"\w+[\w:-]*\w?"):\s*("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[-\w@.()\[\]'"]+))/g;
      while (match = findAttributes.exec(exp)) {
        key = (match[1] || match[3] || match[5]).replace(/^:/, '');
        value = match[2] || match[4] || match[6];
        bool = false;
        if (['false', ''].indexOf(value) === -1) {
          if (['true'].indexOf(value) !== -1) {
            value = "'" + key + "'";
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
          if (quoted = value.match(/^("|')(.*)\1$/)) value = quoted[2];
          if (quoted = key.match(/^("|')(.*)\1$/)) key = quoted[2];
          attributes.push({
            key: key,
            value: value,
            bool: bool
          });
        }
      }
      return attributes.concat(datas);
    };

    Haml.prototype.getDataAttributes = function(exp) {
      var attribute, attributes, data, _i, _len;
      data = /:?data:?\s*(?:=>\s*)?\{([^}]*)\},?/gi.exec(exp);
      if (!(data != null ? data[1] : void 0)) return [exp, []];
      exp = exp.replace(data[0], '');
      attributes = this.parseAttributes(data[1]);
      for (_i = 0, _len = attributes.length; _i < _len; _i++) {
        attribute = attributes[_i];
        attribute.key = "data-" + attribute.key;
      }
      return [exp, attributes];
    };

    Haml.prototype.buildHtmlTagPrefix = function(tokens) {
      var attribute, classes, interpolation, klass, tagParts, _i, _j, _len, _len2, _ref, _ref2;
      tagParts = ["<" + tokens.tag];
      if (tokens.classes) {
        classes = tokens.classes.sort().join(' ');
        if (tokens.classes.length > 1 && classes.match(/#\{/)) {
          classes = '#{ [';
          _ref = tokens.classes;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            klass = _ref[_i];
            if (interpolation = klass.match(/#{(.*)}/)) {
              classes += "(" + interpolation[1] + "),";
            } else {
              classes += "'" + klass + "',";
            }
          }
          classes += '].sort().join(\' \') }';
        }
        tagParts.push("class='" + classes + "'");
      }
      if (tokens.id) tagParts.push("id='" + tokens.id + "'");
      if (tokens.attributes) {
        _ref2 = tokens.attributes;
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          attribute = _ref2[_j];
          if (attribute.bool && this.format === 'html5') {
            tagParts.push("" + attribute.key);
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

  })();

}).call(this);
