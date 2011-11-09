(function() {
  var Haml, Node, qe;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  Node = require('./node');
  qe = require('../helper').escape;
  module.exports = Haml = (function() {
    __extends(Haml, Node);
    function Haml() {
      Haml.__super__.constructor.apply(this, arguments);
    }
    Haml.selfCloseTags = ['meta', 'img', 'link', 'br', 'hr', 'input', 'area', 'param', 'col', 'base'];
    Haml.prototype.evaluate = function() {
      var htmlTagPrefix, prefix, tokens;
      tokens = this.parseExpression(this.expression);
      if (tokens.doctype) {
        return this.opener += "" + (this.buildDocType(tokens.doctype));
      } else {
        prefix = this.buildHtmlTagPrefix(tokens);
        if (this.isNotSelfClosing(tokens.tag)) {
          if (tokens.text) {
            this.opener = "" + (qe(prefix)) + ">" + tokens.text + "</" + tokens.tag + ">";
          } else {
            this.opener = "" + (qe(prefix)) + ">";
            this.closer = "</" + tokens.tag + ">";
          }
        } else {
          htmlTagPrefix = prefix.replace(/\/$/, '');
          this.opener = "" + (qe(htmlTagPrefix)) + (this.format === 'xhtml' ? ' /' : '') + ">";
        }
        if (tokens.assignment) {
          return this.opener += this.escape_html ? "\#{e " + tokens.assignment + "}" : "\#{" + tokens.assignment + "}";
        }
      }
    };
    Haml.prototype.parseExpression = function(exp) {
      var classes, id, options, pair, pairs, tag, _i, _len, _ref, _ref2;
      tag = this.parseTag(exp);
      options = this.parseOptions(exp);
      pairs = [];
      id = (_ref = tag.ids) != null ? _ref.pop() : void 0;
      classes = tag.classes;
      _ref2 = options.pairs;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        pair = _ref2[_i];
        if (pair.key === 'id') {
          if (id) {
            id += '_' + pair.value;
          } else {
            id = pair.value;
          }
        } else if (pair.key === 'class') {
          classes || (classes = []);
          classes.push(pair.value);
        } else {
          pairs.push(pair);
        }
      }
      return {
        doctype: tag.doctype,
        tag: tag.tag,
        id: id,
        classes: classes,
        text: tag.text,
        pairs: pairs,
        assignment: options.assignment
      };
    };
    Haml.prototype.parseTag = function(exp) {
      var classes, doctype, haml, hamltext, id, ids, klass, tag, text, _ref;
      try {
        doctype = (_ref = exp.match(/^(\!{3}.*)/)) != null ? _ref[1] : void 0;
        if (doctype) {
          return {
            doctype: doctype
          };
        }
        hamltext = exp.match(/^((?:[#%\.][a-z0-9_:\-]*[\/]?)+)(?:[\(\{].*[\)\}])?(.*)?$/i);
        haml = hamltext[1];
        if (hamltext[2] && !hamltext[2].match(/^=/)) {
          text = hamltext[2].replace(/^ /, '');
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
          text: text
        };
      } catch (error) {
        throw "Unable to parse tag from " + exp + ": " + error;
      }
    };
    Haml.prototype.parseOptions = function(exp) {
      return {
        assignment: this.parseAssignment(exp),
        pairs: this.parseAttributes(exp)
      };
    };
    Haml.prototype.parseAssignment = function(exp) {
      var assignment;
      assignment = exp.match(/[\}\)]=\s*(\S+)$/);
      if (assignment) {
        return assignment[1];
      } else {
        return;
      }
    };
    Haml.prototype.parseAttributes = function(exp) {
      var attribute, attributes, key, pair, pairs, quoted, value, _i, _len;
      pairs = [];
      attributes = exp.match(/([^:|\s|=]+\s*=>\s*(("[^"]+")|('[^']+')|[^\s,\}]+))|([\w]+=(("[^"]+")|('[^']+')|[^\s\)]+))/g);
      if (!attributes) {
        return pairs;
      }
      for (_i = 0, _len = attributes.length; _i < _len; _i++) {
        attribute = attributes[_i];
        pair = attribute.split(/\=>|\=/);
        key = pair[0].trim();
        value = pair[1].trim();
        if (value === 'true') {
          value = "'" + key + "'";
        } else {
          if (!value.match(/^("|').*\1$/)) {
            value = '\'#{' + value + '}\'';
          }
        }
        if (quoted = value.match(/^("|')(.*)\1$/)) {
          value = quoted[2];
        }
        if (quoted = key.match(/^("|')(.*)\1$/)) {
          key = quoted[2];
        }
        pairs.push({
          key: key,
          value: value
        });
      }
      return pairs;
    };
    Haml.prototype.buildHtmlTagPrefix = function(tokens) {
      var classes, interpolation, klass, pair, tagParts, _i, _j, _len, _len2, _ref, _ref2;
      tagParts = ["<" + tokens.tag];
      if (tokens.classes) {
        classes = tokens.classes.sort().join(' ');
        if (tokens.classes.length > 1 && classes.match(/#\{/)) {
          classes = '#{ [';
          _ref = tokens.classes;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            klass = _ref[_i];
            if (interpolation = klass.match(/#{(.*)}/)) {
              classes += interpolation[1] + ',';
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
      if (tokens.pairs.length > 0) {
        _ref2 = tokens.pairs;
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          pair = _ref2[_j];
          if (pair.key !== pair.value || this.format !== 'html5') {
            tagParts.push("" + pair.key + "='" + pair.value + "'");
          } else {
            tagParts.push("" + pair.key);
          }
        }
      }
      return tagParts.join(' ');
    };
    Haml.prototype.buildDocType = function(doctype) {
      switch ("" + this.format + " " + doctype) {
        case 'xhtml !!! XML':
          return '<?xml version=\'1.0\' encoding=\'utf-8\' ?>';
        case 'xhtml !!!':
          return '<!DOCTYPE html PUBLIC \\"-//W3C//DTD XHTML 1.0 Transitional//EN\\" \\"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd\\">';
        case 'xhtml !!! 1.1':
          return '<!DOCTYPE html PUBLIC \\"-//W3C//DTD XHTML 1.1//EN\\" \\"http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd\\">';
        case 'xhtml !!! mobile':
          return '<!DOCTYPE html PUBLIC \\"-//WAPFORUM//DTD XHTML Mobile 1.2//EN\\" \\"http://www.openmobilealliance.org/tech/DTD/xhtml-mobile12.dtd\\">';
        case 'xhtml !!! basic':
          return '<!DOCTYPE html PUBLIC \\"-//W3C//DTD XHTML Basic 1.1//EN\\" \\"http://www.w3.org/TR/xhtml-basic/xhtml-basic11.dtd\\">';
        case 'xhtml !!! frameset':
          return '<!DOCTYPE html PUBLIC \\"-//W3C//DTD XHTML 1.0 Frameset//EN\\" \\"http://www.w3.org/TR/xhtml1/DTD/xhtml1-frameset.dtd\\">';
        case 'xhtml !!! 5':
        case 'html5 !!!':
          return '<!DOCTYPE html>';
        case 'html5 !!! XML':
        case 'html4 !!! XML':
          return '';
        case 'html4 !!!':
          return '<!DOCTYPE html PUBLIC \\"-//W3C//DTD HTML 4.01 Transitional//EN\\" \\"http://www.w3.org/TR/html4/loose.dtd\\">';
        case 'html4 !!! frameset':
          return '<!DOCTYPE html PUBLIC \\"-//W3C//DTD HTML 4.01 Frameset//EN\\" \\"http://www.w3.org/TR/html4/frameset.dtd\\">';
        case 'html4 !!! strict':
          return '<!DOCTYPE html PUBLIC \\"-//W3C//DTD HTML 4.01//EN\\" \\"http://www.w3.org/TR/html4/strict.dtd\\">';
      }
    };
    Haml.prototype.isNotSelfClosing = function(tag) {
      return Haml.selfCloseTags.indexOf(tag) === -1 && !tag.match(/\/$/);
    };
    return Haml;
  })();
}).call(this);
