(function() {

  module.exports = {
    whitespace: function(n) {
      var a;
      n = n * 2;
      a = [];
      while (a.length < n) {
        a.push(' ');
      }
      return a.join('');
    },
    escapeQuotes: function(text) {
      if (!text) {
        return '';
      }
      return text.replace(/"/g, '\\"').replace(/\\\\\"/g, '\\"');
    },
    unescapeQuotes: function(text) {
      if (!text) {
        return '';
      }
      return text.replace(/\\"/g, '"');
    },
    escapeHTML: function(text) {
      if (!text) {
        return '';
      }
      return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;');
    },
    preserve: function(code) {
      if (code) {
        return code.replace(/<(pre|textarea)>(.*?)<\/\1>/g, function(text) {
          return text.replace('\\n', '\&\#x000A;');
        });
      }
    },
    indent: function(text, spaces) {
      return text.replace(/^(.*)$/mg, module.exports.whitespace(spaces) + '$1');
    }
  };

}).call(this);
