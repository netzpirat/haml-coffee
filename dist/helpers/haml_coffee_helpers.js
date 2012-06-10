(function() {
  var HamlCoffeeHelpers;

  HamlCoffeeHelpers = (function() {

    function HamlCoffeeHelpers() {}

    HamlCoffeeHelpers.prototype.htmlEscape = function(text) {
      return ("" + text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\'/g, '&apos;').replace(/\"/g, '&quot;');
    };

    HamlCoffeeHelpers.prototype.preserve = function(text) {
      return text.replace(/\\n/g, '&#x000A;');
    };

    HamlCoffeeHelpers.prototype.findAndPreserve = function(text) {
      return text.replace(/<(textarea|pre)>([^]*?)<\/\1>/g, function(str, tag, content) {
        return "<\#{ tag }>\#{ content.replace /\\n/g, '&#x000A;' }</\#{ tag }>";
      });
    };

    HamlCoffeeHelpers.prototype.cleanValue = function(value) {
      if (value === null || value === void 0) {
        return '';
      } else {
        return value;
      }
    };

    HamlCoffeeHelpers.prototype.surround = function(start, end, fn) {
      return start + fn() + end;
    };

    HamlCoffeeHelpers.prototype.succeed = function(end, fn) {
      return fn() + end;
    };

    HamlCoffeeHelpers.prototype.precede = function(start, fn) {
      return start + fn();
    };

    return HamlCoffeeHelpers;

  })();

}).call(this);
