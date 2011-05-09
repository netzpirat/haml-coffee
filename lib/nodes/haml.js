(function() {
  var Haml, Node, e;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  Node = require('./node');
  e = require('../helper').escape;
  module.exports = Haml = (function() {
    function Haml() {
      Haml.__super__.constructor.apply(this, arguments);
    }
    __extends(Haml, Node);
    Haml.selfCloseTags = ["meta", "img", "link", "br", "hr", "input", "area", "base"];
    Haml.prototype.evaluate = function() {
      var htmlTagPrefix, parsedExpression;
      parsedExpression = this.parseExpression(this.expression);
      htmlTagPrefix = this.buildHtmlTag(parsedExpression);
      if (this.isSelfClosing(parsedExpression.tag)) {
        this.opener = "" + this.cw + "o.push \"" + this.hw + (e(htmlTagPrefix)) + ">";
        this.closer = "" + this.cw + "o.push \"" + this.hw + "</" + parsedExpression.tag + ">\"";
      } else {
        this.opener = "" + this.cw + "o.push \"" + this.hw + (e(htmlTagPrefix)) + " />";
      }
      if (parsedExpression.assignment) {
        this.opener += '#{' + parsedExpression.assignment + '}';
      }
      return this.opener += '"';
    };
    Haml.prototype.parseExpression = function(exp) {
      var optionProperties, tagProperties;
      tagProperties = this.parseTag(exp);
      optionProperties = this.parseOptions(exp);
      return {
        tag: tagProperties.tag,
        ids: tagProperties.ids,
        classes: tagProperties.classes,
        pairs: optionProperties.pairs,
        assignment: optionProperties.assignment
      };
    };
    Haml.prototype.buildHtmlTag = function(parsedExpression) {
      var pair, tagParts, _i, _len, _ref;
      tagParts = ["<" + parsedExpression.tag];
      if (parsedExpression.ids) {
        tagParts.push("id=\"" + (parsedExpression.ids.join(' ')) + "\"");
      }
      if (parsedExpression.classes) {
        tagParts.push("class=\"" + (parsedExpression.classes.join(' ')) + "\"");
      }
      if (parsedExpression.pairs.length > 0) {
        _ref = parsedExpression.pairs;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          pair = _ref[_i];
          tagParts.push("" + pair.key + "=" + pair.value);
        }
      }
      return tagParts.join(' ');
    };
    Haml.prototype.parseTag = function(exp) {
      var classes, id, ids, klass, tag, tagExp;
      try {
        tagExp = exp.match(/^((?:[.#%][a-z_\-][a-z0-9_:\-]*)+)(.*)$/i)[1];
        tag = tagExp.match(/\%([a-z_\-][a-z0-9_:\-]*)/i);
        tag = tag ? tag[1] : 'div';
        ids = tagExp.match(/\#([a-z_\-][a-z0-9_\-]*)/gi);
        classes = tagExp.match(/\.([a-z_\-][a-z0-9_\-]*)/gi);
        return {
          tag: tag,
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
          })() : void 0
        };
      } catch (error) {
        throw "Unable to parse tag from " + exp + ": " + error;
      }
    };
    Haml.prototype.parseOptions = function(exp) {
      var assignment, attributesExp, optionsExp, pairs;
      optionsExp = exp.match(/[\{\s=].*/i);
      if (optionsExp) {
        optionsExp = optionsExp[0];
        if (optionsExp[0] === "{") {
          attributesExp = optionsExp.match(/\{(.*)\}/);
          if (attributesExp) {
            attributesExp = attributesExp[1];
          }
          assignment = optionsExp.match(/\{.*\}\s*=\s*(.*)/);
        } else {
          assignment = optionsExp.match(/\.*=\s*(.*)/);
        }
        if (assignment) {
          assignment = assignment[1];
        }
        pairs = this.parseAttributes(attributesExp);
      }
      return {
        assignment: assignment,
        pairs: pairs || []
      };
    };
    Haml.prototype.parseAttributes = function(attributesExp) {
      var attribute, attributes, key, pair, pairs, result, value, valueIsLiteral, _i, _len;
      pairs = [];
      if (attributesExp == null) {
        return pairs;
      }
      attributes = attributesExp.match(/(:[^\s|=]+\s*=>\s*(("[^"]+")|('[^']+')|[^\s]+))/g);
      for (_i = 0, _len = attributes.length; _i < _len; _i++) {
        attribute = attributes[_i];
        pair = attribute.split('=>');
        key = pair[0].trim().substr(1);
        result = key.match(/^'(.+)'$/);
        if (result) {
          key = result[1];
        }
        value = pair[1].trim();
        valueIsLiteral = value.match(/("|')/);
        pairs.push({
          key: key,
          value: valueIsLiteral ? value : '"#{' + value + '}"'
        });
      }
      return pairs;
    };
    Haml.prototype.isSelfClosing = function(tag) {
      return Haml.selfCloseTags.indexOf(tag) === -1;
    };
    return Haml;
  })();
}).call(this);
