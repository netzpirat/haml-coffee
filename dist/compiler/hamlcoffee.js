var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var res = mod._cached ? mod._cached : mod();
    return res;
}

require.paths = [];
require.modules = {};
require.extensions = [".js",".coffee"];

require._core = {
    'assert': true,
    'events': true,
    'fs': true,
    'path': true,
    'vm': true
};

require.resolve = (function () {
    return function (x, cwd) {
        if (!cwd) cwd = '/';
        
        if (require._core[x]) return x;
        var path = require.modules.path();
        cwd = path.resolve('/', cwd);
        var y = cwd || '/';
        
        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x))
                || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }
        
        var n = loadNodeModulesSync(x, y);
        if (n) return n;
        
        throw new Error("Cannot find module '" + x + "'");
        
        function loadAsFileSync (x) {
            if (require.modules[x]) {
                return x;
            }
            
            for (var i = 0; i < require.extensions.length; i++) {
                var ext = require.extensions[i];
                if (require.modules[x + ext]) return x + ext;
            }
        }
        
        function loadAsDirectorySync (x) {
            x = x.replace(/\/+$/, '');
            var pkgfile = x + '/package.json';
            if (require.modules[pkgfile]) {
                var pkg = require.modules[pkgfile]();
                var b = pkg.browserify;
                if (typeof b === 'object' && b.main) {
                    var m = loadAsFileSync(path.resolve(x, b.main));
                    if (m) return m;
                }
                else if (typeof b === 'string') {
                    var m = loadAsFileSync(path.resolve(x, b));
                    if (m) return m;
                }
                else if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                }
            }
            
            return loadAsFileSync(x + '/index');
        }
        
        function loadNodeModulesSync (x, start) {
            var dirs = nodeModulesPathsSync(start);
            for (var i = 0; i < dirs.length; i++) {
                var dir = dirs[i];
                var m = loadAsFileSync(dir + '/' + x);
                if (m) return m;
                var n = loadAsDirectorySync(dir + '/' + x);
                if (n) return n;
            }
            
            var m = loadAsFileSync(x);
            if (m) return m;
        }
        
        function nodeModulesPathsSync (start) {
            var parts;
            if (start === '/') parts = [ '' ];
            else parts = path.normalize(start).split('/');
            
            var dirs = [];
            for (var i = parts.length - 1; i >= 0; i--) {
                if (parts[i] === 'node_modules') continue;
                var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
                dirs.push(dir);
            }
            
            return dirs;
        }
    };
})();

require.alias = function (from, to) {
    var path = require.modules.path();
    var res = null;
    try {
        res = require.resolve(from + '/package.json', '/');
    }
    catch (err) {
        res = require.resolve(from, '/');
    }
    var basedir = path.dirname(res);
    
    var keys = (Object.keys || function (obj) {
        var res = [];
        for (var key in obj) res.push(key)
        return res;
    })(require.modules);
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.slice(0, basedir.length + 1) === basedir + '/') {
            var f = key.slice(basedir.length);
            require.modules[to + f] = require.modules[basedir + f];
        }
        else if (key === basedir) {
            require.modules[to] = require.modules[basedir];
        }
    }
};

require.define = function (filename, fn) {
    var dirname = require._core[filename]
        ? ''
        : require.modules.path().dirname(filename)
    ;
    
    var require_ = function (file) {
        return require(file, dirname)
    };
    require_.resolve = function (name) {
        return require.resolve(name, dirname);
    };
    require_.modules = require.modules;
    require_.define = require.define;
    var module_ = { exports : {} };
    
    require.modules[filename] = function () {
        require.modules[filename]._cached = module_.exports;
        fn.call(
            module_.exports,
            require_,
            module_,
            module_.exports,
            dirname,
            filename
        );
        require.modules[filename]._cached = module_.exports;
        return module_.exports;
    };
};

if (typeof process === 'undefined') process = {};

if (!process.nextTick) process.nextTick = (function () {
    var queue = [];
    var canPost = typeof window !== 'undefined'
        && window.postMessage && window.addEventListener
    ;
    
    if (canPost) {
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'browserify-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);
    }
    
    return function (fn) {
        if (canPost) {
            queue.push(fn);
            window.postMessage('browserify-tick', '*');
        }
        else setTimeout(fn, 0);
    };
})();

if (!process.title) process.title = 'browser';

if (!process.binding) process.binding = function (name) {
    if (name === 'evals') return require('vm')
    else throw new Error('No such module')
};

if (!process.cwd) process.cwd = function () { return '.' };

require.define("path", function (require, module, exports, __dirname, __filename) {
function filter (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (fn(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }
  
  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  var isWindows = false;
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};

});

require.define("/haml-coffee.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var Code, Comment, Filter, Haml, HamlCoffee, Node, Text, indent, whitespace;

  Node = require('./nodes/node');

  Text = require('./nodes/text');

  Haml = require('./nodes/haml');

  Code = require('./nodes/code');

  Comment = require('./nodes/comment');

  Filter = require('./nodes/filter');

  whitespace = require('./util/text').whitespace;

  indent = require('./util/text').indent;

  module.exports = HamlCoffee = (function() {

    HamlCoffee.VERSION = '1.9.1';

    function HamlCoffee(options) {
      var _base, _base10, _base11, _base2, _base3, _base4, _base5, _base6, _base7, _base8, _base9, _ref, _ref10, _ref11, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
      this.options = options != null ? options : {};
      if ((_ref = (_base = this.options).placement) == null) {
        _base.placement = 'global';
      }
      if ((_ref2 = (_base2 = this.options).dependencies) == null) {
        _base2.dependencies = {
          hc: 'hamlcoffee'
        };
      }
      if ((_ref3 = (_base3 = this.options).escapeHtml) == null) {
        _base3.escapeHtml = true;
      }
      if ((_ref4 = (_base4 = this.options).escapeAttributes) == null) {
        _base4.escapeAttributes = true;
      }
      if ((_ref5 = (_base5 = this.options).cleanValue) == null) {
        _base5.cleanValue = true;
      }
      if ((_ref6 = (_base6 = this.options).uglify) == null) _base6.uglify = false;
      if ((_ref7 = (_base7 = this.options).basename) == null) {
        _base7.basename = false;
      }
      if ((_ref8 = (_base8 = this.options).extendScope) == null) {
        _base8.extendScope = false;
      }
      if ((_ref9 = (_base9 = this.options).format) == null) {
        _base9.format = 'html5';
      }
      if ((_ref10 = (_base10 = this.options).preserveTags) == null) {
        _base10.preserveTags = 'pre,textarea';
      }
      if ((_ref11 = (_base11 = this.options).selfCloseTags) == null) {
        _base11.selfCloseTags = 'meta,img,link,br,hr,input,area,param,col,base';
      }
    }

    HamlCoffee.prototype.indentChanged = function() {
      return this.currentIndent !== this.previousIndent;
    };

    HamlCoffee.prototype.isIndent = function() {
      return this.currentIndent > this.previousIndent;
    };

    HamlCoffee.prototype.updateTabSize = function() {
      if (this.tabSize === 0) {
        return this.tabSize = this.currentIndent - this.previousIndent;
      }
    };

    HamlCoffee.prototype.updateBlockLevel = function() {
      this.currentBlockLevel = this.currentIndent / this.tabSize;
      if (this.currentBlockLevel - Math.floor(this.currentBlockLevel) > 0) {
        throw "Indentation error in line " + this.lineNumber;
      }
      if ((this.currentIndent - this.previousIndent) / this.tabSize > 1) {
        if (!this.node.isCommented()) {
          throw "Block level too deep in line " + this.lineNumber;
        }
      }
      return this.delta = this.previousBlockLevel - this.currentBlockLevel;
    };

    HamlCoffee.prototype.updateCodeBlockLevel = function(node) {
      if (node instanceof Code) {
        return this.currentCodeBlockLevel = node.codeBlockLevel + 1;
      } else {
        return this.currentCodeBlockLevel = node.codeBlockLevel;
      }
    };

    HamlCoffee.prototype.updateParent = function() {
      if (this.isIndent()) {
        return this.pushParent();
      } else {
        return this.popParent();
      }
    };

    HamlCoffee.prototype.pushParent = function() {
      this.stack.push(this.parentNode);
      return this.parentNode = this.node;
    };

    HamlCoffee.prototype.popParent = function() {
      var i, _ref, _results;
      _results = [];
      for (i = 0, _ref = this.delta - 1; 0 <= _ref ? i <= _ref : i >= _ref; 0 <= _ref ? i++ : i--) {
        _results.push(this.parentNode = this.stack.pop());
      }
      return _results;
    };

    HamlCoffee.prototype.getNodeOptions = function(override) {
      if (override == null) override = {};
      return {
        parentNode: override.parentNode || this.parentNode,
        blockLevel: override.blockLevel || this.currentBlockLevel,
        codeBlockLevel: override.codeBlockLevel || this.currentCodeBlockLevel,
        escapeHtml: override.escapeHtml || this.options.escapeHtml,
        escapeAttributes: override.escapeAttributes || this.options.escapeAttributes,
        cleanValue: override.cleanValue || this.options.cleanValue,
        format: override.format || this.options.format,
        preserveTags: override.preserveTags || this.options.preserveTags,
        selfCloseTags: override.selfCloseTags || this.options.selfCloseTags,
        uglify: override.uglify || this.options.uglify
      };
    };

    HamlCoffee.prototype.nodeFactory = function(expression) {
      var node, options, _ref;
      if (expression == null) expression = '';
      options = this.getNodeOptions();
      if (expression.match(/^:(escaped|preserve|css|javascript|plain|cdata|coffeescript)/)) {
        node = new Filter(expression, options);
      } else if (expression.match(/^(\/|-#)(.*)/)) {
        node = new Comment(expression, options);
      } else if (expression.match(/^(-#|-|=|!=|\&=|~)\s*(.*)/)) {
        node = new Code(expression, options);
      } else if (expression.match(/^(%|#[^{]|\.|\!)(.*)/)) {
        node = new Haml(expression, options);
      } else {
        node = new Text(expression, options);
      }
      if ((_ref = options.parentNode) != null) _ref.addChild(node);
      return node;
    };

    HamlCoffee.prototype.parse = function(source) {
      var attributes, expression, line, lines, result, text, ws, _ref;
      if (source == null) source = '';
      this.lineNumber = this.previousIndent = this.tabSize = this.currentBlockLevel = this.previousBlockLevel = 0;
      this.currentCodeBlockLevel = this.previousCodeBlockLevel = 0;
      this.node = null;
      this.stack = [];
      this.root = this.parentNode = new Node('', this.getNodeOptions());
      lines = source.split("\n");
      while ((line = lines.shift()) !== void 0) {
        if ((this.node instanceof Filter) && !this.exitFilter) {
          if (/^(\s)*$/.test(line)) {
            this.node.addChild(new Text('', this.getNodeOptions({
              parentNode: this.node
            })));
          } else {
            result = line.match(/^(\s*)(.*)/);
            ws = result[1];
            expression = result[2];
            if (this.node.blockLevel >= (ws.length / 2)) {
              this.exitFilter = true;
              lines.unshift(line);
              continue;
            }
            text = line.match(RegExp("^\\s{" + ((this.node.blockLevel * 2) + 2) + "}(.*)"));
            if (text) {
              this.node.addChild(new Text(text[1], this.getNodeOptions({
                parentNode: this.node
              })));
            }
          }
        } else {
          this.exitFilter = false;
          result = line.match(/^(\s*)(.*)/);
          ws = result[1];
          expression = result[2];
          if (/^\s*$/.test(line)) continue;
          while (/^[%.#].*[{(]/.test(expression) && !/^(\s*)[-=&!~.%#</]/.test(lines[0]) && /([-\w]+[\w:-]*\w?)\s*=|('\w+[\w:-]*\w?')\s*=|("\w+[\w:-]*\w?")\s*=|(\w+[\w:-]*\w?):|('[-\w]+[\w:-]*\w?'):|("[-\w]+[\w:-]*\w?"):|:(\w+[\w:-]*\w?)\s*=>|:?'([-\w]+[\w:-]*\w?)'\s*=>|:?"([-\w]+[\w:-]*\w?)"\s*=>/.test(lines[0])) {
            attributes = lines.shift();
            expression = expression.replace(/(\s)+\|\s*$/, '');
            expression += ' ' + attributes.match(/^\s*(.*?)(\s+\|\s*)?$/)[1];
            this.lineNumber++;
          }
          if (expression.match(/(\s)+\|\s*$/)) {
            expression = expression.replace(/(\s)+\|\s*$/, ' ');
            while ((_ref = lines[0]) != null ? _ref.match(/(\s)+\|$/) : void 0) {
              expression += lines.shift().match(/^(\s*)(.*)/)[2].replace(/(\s)+\|\s*$/, '');
              this.lineNumber++;
            }
          }
          this.currentIndent = ws.length;
          if (this.indentChanged()) {
            this.updateTabSize();
            this.updateBlockLevel();
            this.updateParent();
            this.updateCodeBlockLevel(this.parentNode);
          }
          this.node = this.nodeFactory(expression);
          this.previousBlockLevel = this.currentBlockLevel;
          this.previousIndent = this.currentIndent;
        }
        this.lineNumber++;
      }
      return this.evaluate(this.root);
    };

    HamlCoffee.prototype.evaluate = function(node) {
      var child, _i, _len, _ref;
      _ref = node.children;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        child = _ref[_i];
        this.evaluate(child);
      }
      return node.evaluate();
    };

    HamlCoffee.prototype.render = function(templateName, namespace) {
      if (namespace == null) namespace = 'window.HAML';
      switch (this.options.placement) {
        case 'amd':
          return this.renderAmd();
        default:
          return this.renderGlobal(templateName, namespace);
      }
    };

    HamlCoffee.prototype.renderAmd = function() {
      var m, module, modules, param, params, template, _ref, _ref2;
      if (/^hamlcoffee/.test(this.options.dependencies['hc'])) {
        this.options.customHtmlEscape = 'hc.escape';
        this.options.customCleanValue = 'hc.cleanValue';
        this.options.customPreserve = 'hc.preserve';
        this.options.customFindAndPreserve = 'hc.findAndPreserve';
        this.options.customSurround = 'hc.surround';
        this.options.customSucceed = 'hc.succeed';
        this.options.customPrecede = 'hc.precede';
        this.options.customReference = 'hc.reference';
      }
      modules = [];
      params = [];
      _ref = this.options.dependencies;
      for (param in _ref) {
        module = _ref[param];
        modules.push(module);
        params.push(param);
      }
      template = indent(this.precompile(), 4);
      _ref2 = this.findDependencies(template);
      for (param in _ref2) {
        module = _ref2[param];
        modules.push(module);
        params.push(param);
      }
      if (modules.length !== 0) {
        modules = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = modules.length; _i < _len; _i++) {
            m = modules[_i];
            _results.push("'" + m + "'");
          }
          return _results;
        })();
        modules = "[" + modules + "], (" + (params.join(', ')) + ")";
      } else {
        modules = '';
      }
      return "define " + modules + " ->\n  (context) ->\n    render = ->\n      \n" + template + "\n    render.call(context)";
    };

    HamlCoffee.prototype.renderGlobal = function(templateName, namespace) {
      var segment, segments, template, _i, _len;
      if (namespace == null) namespace = 'window.HAML';
      template = '';
      segments = ("" + namespace + "." + templateName).replace(/(\s|-)+/g, '_').split(/\./);
      templateName = this.options.basename ? segments.pop().split(/\/|\\/).pop() : segments.pop();
      namespace = segments.shift();
      if (segments.length !== 0) {
        for (_i = 0, _len = segments.length; _i < _len; _i++) {
          segment = segments[_i];
          namespace += "." + segment;
          template += "" + namespace + " ?= {}\n";
        }
      } else {
        template += "" + namespace + " ?= {}\n";
      }
      if (this.options.extendScope) {
        template += "" + namespace + "['" + templateName + "'] = (context) -> ( ->\n";
        template += "  `with (context || {}) {`\n";
        template += "" + (indent(this.precompile(), 1));
        template += "`}`\n";
        template += ").call(context)";
      } else {
        template += "" + namespace + "['" + templateName + "'] = (context) -> ( ->\n";
        template += "" + (indent(this.precompile(), 1));
        template += ").call(context)";
      }
      return template;
    };

    HamlCoffee.prototype.precompile = function() {
      var code, fn;
      fn = '';
      code = this.createCode();
      if (code.indexOf('$e') !== -1) {
        if (this.options.customHtmlEscape) {
          fn += "$e = " + this.options.customHtmlEscape + "\n";
        } else {
          fn += "$e = (text, escape) ->\n  \"\#{ text }\"\n  .replace(/&/g, '&amp;')\n  .replace(/</g, '&lt;')\n  .replace(/>/g, '&gt;')\n  .replace(/\'/g, '&#39;')\n  .replace(/\\//g, '&#47;')\n  .replace(/\"/g, '&quot;')\n";
        }
      }
      if (code.indexOf('$c') !== -1) {
        if (this.options.customCleanValue) {
          fn += "$c = " + this.options.customCleanValue + "\n";
        } else {
          fn += "$c = (text) ->\n";
          fn += "   switch text\n";
          fn += "     when null, undefined then ''\n";
          fn += "     when true, false then '\u0093' + text\n";
          fn += "     else text\n";
        }
      }
      if (code.indexOf('$p') !== -1 || code.indexOf('$fp') !== -1) {
        if (this.options.customPreserve) {
          fn += "$p = " + this.options.customPreserve + "\n";
        } else {
          fn += "$p = (text) -> text.replace /\\n/g, '&#x000A;'\n";
        }
      }
      if (code.indexOf('$fp') !== -1) {
        if (this.options.customFindAndPreserve) {
          fn += "$fp = " + this.options.customFindAndPreserve + "\n";
        } else {
          fn += "$fp = (text) ->\n  text.replace /<(" + (this.options.preserveTags.split(',').join('|')) + ")>([^]*?)<\\/\\1>/g, (str, tag, content) ->\n    \"<\#{ tag }>\#{ $p content }</\#{ tag }>\"\n";
        }
      }
      if (code.indexOf('surround') !== -1) {
        if (this.options.customSurround) {
          fn += "surround = (start, end, fn) => " + this.options.customSurround + ".call(@, start, end, fn)\n";
        } else {
          fn += "surround = (start, end, fn) => start + fn.call(@)?.replace(/^\s+|\s+$/g, '') + end\n";
        }
      }
      if (code.indexOf('succeed') !== -1) {
        if (this.options.customSucceed) {
          fn += "succeed = (start, end, fn) => " + this.options.customSucceed + ".call(@, start, end, fn)\n";
        } else {
          fn += "succeed = (end, fn) => fn.call(@)?.replace(/\s+$/g, '') + end\n";
        }
      }
      if (code.indexOf('precede') !== -1) {
        if (this.options.customPrecede) {
          fn += "precede = (start, end, fn) => " + this.options.customPrecede + ".call(@, start, end, fn)\n";
        } else {
          fn += "precede = (start, fn) => start + fn.call(@)?.replace(/^\s+/g, '')\n";
        }
      }
      if (code.indexOf('$r') !== -1) {
        if (this.options.customReference) {
          fn += "$r = " + this.options.customReference + "\n";
        } else {
          fn += "$r = (object, prefix) ->\n  name = if prefix then prefix + '_' else ''\n\n  if typeof(object.hamlObjectRef) is 'function'\n    name += object.hamlObjectRef()\n  else\n    name += (object.constructor?.name || 'object').replace(/\W+/g, '_').replace(/([a-z\d])([A-Z])/g, '$1_$2').toLowerCase()\n\n  id = if typeof(object.to_key) is 'function'\n         object.to_key()\n       else if typeof(object.id) is 'function'\n         object.id()\n       else if object.id\n         object.id\n      else\n        object\n\n  result  = \"class='\#{ name }'\"\n  result += \" id='\#{ name }_\#{ id }'\" if id\n";
        }
      }
      fn += "$o = []\n";
      fn += "" + code + "\n";
      return fn += "return $o.join(\"\\n\")" + (this.convertBooleans(code)) + (this.removeEmptyIDAndClass(code)) + (this.cleanupWhitespace(code)) + "\n";
    };

    HamlCoffee.prototype.createCode = function() {
      var child, code, line, processors, _i, _j, _len, _len2, _ref, _ref2;
      code = [];
      this.lines = [];
      _ref = this.root.children;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        child = _ref[_i];
        this.lines = this.lines.concat(child.render());
      }
      this.lines = this.combineText(this.lines);
      this.blockLevel = 0;
      _ref2 = this.lines;
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        line = _ref2[_j];
        if (line !== null) {
          switch (line.type) {
            case 'text':
              code.push("" + (whitespace(line.cw)) + (this.getBuffer(this.blockLevel)) + ".push \"" + (whitespace(line.hw)) + line.text + "\"");
              break;
            case 'run':
              if (line.block !== 'end') {
                code.push("" + (whitespace(line.cw)) + line.code);
              } else {
                code.push("" + (whitespace(line.cw)) + (line.code.replace('$buffer', this.getBuffer(this.blockLevel))));
                this.blockLevel -= 1;
              }
              break;
            case 'insert':
              processors = '';
              if (line.findAndPreserve) processors += '$fp ';
              if (line.preserve) processors += '$p ';
              if (line.escape) processors += '$e ';
              if (this.options.cleanValue) processors += '$c ';
              code.push("" + (whitespace(line.cw)) + (this.getBuffer(this.blockLevel)) + ".push \"" + (whitespace(line.hw)) + "\" + " + processors + line.code);
              if (line.block === 'start') {
                this.blockLevel += 1;
                code.push("" + (whitespace(line.cw + 1)) + (this.getBuffer(this.blockLevel)) + " = []");
              }
          }
        }
      }
      return code.join('\n');
    };

    HamlCoffee.prototype.getBuffer = function(level) {
      if (level > 0) {
        return "$o" + level;
      } else {
        return '$o';
      }
    };

    HamlCoffee.prototype.combineText = function(lines) {
      var combined, line, nextLine;
      combined = [];
      while ((line = lines.shift()) !== void 0) {
        if (line.type === 'text') {
          while (lines[0] && lines[0].type === 'text' && line.cw === lines[0].cw) {
            nextLine = lines.shift();
            line.text += "\\n" + (whitespace(nextLine.hw)) + nextLine.text;
          }
        }
        combined.push(line);
      }
      return combined;
    };

    HamlCoffee.prototype.convertBooleans = function(code) {
      if (code.indexOf('$c') !== -1) {
        if (this.options.format === 'xhtml') {
          return '.replace(/\\s(\\w+)=\'\u0093true\'/mg, " $1=\'$1\'").replace(/\\s(\\w+)=\'\u0093false\'/mg, \'\')';
        } else {
          return '.replace(/\\s(\\w+)=\'\u0093true\'/mg, \' $1\').replace(/\\s(\\w+)=\'\u0093false\'/mg, \'\')';
        }
      } else {
        return '';
      }
    };

    HamlCoffee.prototype.removeEmptyIDAndClass = function(code) {
      if (code.indexOf('id=') !== -1 || code.indexOf('class=') !== -1) {
        return '.replace(/\\s(?:id|class)=([\'"])(\\1)/mg, "")';
      } else {
        return '';
      }
    };

    HamlCoffee.prototype.cleanupWhitespace = function(code) {
      if (/\u0091|\u0092/.test(code)) {
        return ".replace(/[\\s\\n]*\\u0091/mg, '').replace(/\\u0092[\\s\\n]*/mg, '')";
      } else {
        return '';
      }
    };

    HamlCoffee.prototype.findDependencies = function(code) {
      var dependencies, match, module, name, requireRegexp;
      requireRegexp = /require(?:\s+|\()(['"])(.+?)(\1)\)?/gm;
      dependencies = {};
      while (match = requireRegexp.exec(code)) {
        module = match[2];
        name = module.split('/').pop();
        dependencies[name] = module;
      }
      return dependencies;
    };

    return HamlCoffee;

  })();

}).call(this);

});

require.define("/nodes/node.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var Node, escapeHTML;

  escapeHTML = require('../util/text').escapeHTML;

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
      if (this.preserve) return true;
      if (this.parentNode) {
        return this.parentNode.isPreserved();
      } else {
        return false;
      }
    };

    Node.prototype.isCommented = function() {
      if (this.constructor.name === 'Comment') return true;
      if (this.parentNode) {
        return this.parentNode.isCommented();
      } else {
        return false;
      }
    };

    Node.prototype.markText = function(text, escape) {
      if (escape == null) escape = false;
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
      if (escape == null) escape = false;
      if (preserve == null) preserve = false;
      if (findAndPreserve == null) findAndPreserve = false;
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
      var child, output, rendered, tag, _i, _j, _k, _l, _len, _len2, _len3, _len4, _len5, _m, _ref, _ref2, _ref3, _ref4, _ref5;
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
            this.wsRemoval.inside = true;
            output.push(this.getOpener());
            _ref = this.children;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              child = _ref[_i];
              _ref2 = child.render();
              for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
                rendered = _ref2[_j];
                rendered.hw = this.blockLevel;
                output.push(rendered);
              }
            }
            output.push(this.getCloser());
          } else {
            output.push(this.getOpener());
            _ref3 = this.children;
            for (_k = 0, _len3 = _ref3.length; _k < _len3; _k++) {
              child = _ref3[_k];
              output = output.concat(child.render());
            }
            output.push(this.getCloser());
          }
        } else if (this.opener) {
          output.push(this.getOpener());
          _ref4 = this.children;
          for (_l = 0, _len4 = _ref4.length; _l < _len4; _l++) {
            child = _ref4[_l];
            output = output.concat(child.render());
          }
        } else {
          _ref5 = this.children;
          for (_m = 0, _len5 = _ref5.length; _m < _len5; _m++) {
            child = _ref5[_m];
            output.push(this.markText(child.render().text));
          }
        }
      }
      return output;
    };

    return Node;

  })();

}).call(this);

});

require.define("/util/text.coffee", function (require, module, exports, __dirname, __filename) {

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
      if (!text) return '';
      return text.replace(/"/g, '\\"').replace(/\\\\\"/g, '\\"');
    },
    unescapeQuotes: function(text) {
      if (!text) return '';
      return text.replace(/\\"/g, '"');
    },
    escapeHTML: function(text) {
      if (!text) return '';
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

});

require.define("/nodes/text.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var Node, Text, escapeQuotes;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Node = require('./node');

  escapeQuotes = require('../util/text').escapeQuotes;

  module.exports = Text = (function() {

    __extends(Text, Node);

    function Text() {
      Text.__super__.constructor.apply(this, arguments);
    }

    Text.prototype.evaluate = function() {
      return this.opener = this.markText(escapeQuotes(this.expression));
    };

    return Text;

  })();

}).call(this);

});

require.define("/nodes/haml.coffee", function (require, module, exports, __dirname, __filename) {
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
      var attributes, classes, id, key, tag, value, _ref, _ref2;
      tag = this.parseTag(exp);
      if (this.preserveTags.indexOf(tag.tag) !== -1) this.preserve = true;
      id = this.interpolateCodeAttribute((_ref = tag.ids) != null ? _ref.pop() : void 0, true);
      classes = tag.classes;
      attributes = {};
      if (tag.attributes) {
        _ref2 = tag.attributes;
        for (key in _ref2) {
          value = _ref2[key];
          if (key === 'id') {
            if (id) {
              id += '_' + this.interpolateCodeAttribute(value, true);
            } else {
              id = this.interpolateCodeAttribute(value, true);
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
        assignment: tag.assignment,
        reference: tag.reference
      };
    };

    Haml.prototype.parseTag = function(exp) {
      var assignment, attr, attributes, ch, classes, doctype, end, haml, htmlAttributes, id, ids, key, klass, level, pos, reference, rest, rubyAttributes, start, tag, text, val, whitespace, _i, _j, _len, _len2, _ref, _ref2, _ref3, _ref4, _ref5;
      try {
        doctype = (_ref = exp.match(/^(\!{3}.*)/)) != null ? _ref[1] : void 0;
        if (doctype) {
          return {
            doctype: doctype
          };
        }
        haml = exp.match(/^((?:[#%\.][a-z0-9_:\-]*[\/]?)+)/i)[0];
        rest = exp.substring(haml.length);
        if (rest.match(/^[{([]/)) {
          reference = '';
          htmlAttributes = '';
          rubyAttributes = '';
          _ref2 = ['[', '{', '(', '[', '{', '('];
          for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            start = _ref2[_i];
            if (start === rest[0]) {
              end = (function() {
                switch (start) {
                  case '{':
                    return '}';
                  case '(':
                    return ')';
                  case '[':
                    return ']';
                }
              })();
              level = 0;
              for (pos = 0, _ref3 = rest.length; 0 <= _ref3 ? pos <= _ref3 : pos >= _ref3; 0 <= _ref3 ? pos++ : pos--) {
                ch = rest[pos];
                if (ch === start) level += 1;
                if (ch === end) {
                  if (level === 1) {
                    break;
                  } else {
                    level -= 1;
                  }
                }
              }
              switch (start) {
                case '{':
                  rubyAttributes += rest.substring(0, pos + 1);
                  rest = rest.substring(pos + 1);
                  break;
                case '(':
                  htmlAttributes += rest.substring(0, pos + 1);
                  rest = rest.substring(pos + 1);
                  break;
                case '[':
                  reference = rest.substring(1, pos);
                  rest = rest.substring(pos + 1);
              }
            }
          }
          assignment = rest || '';
        } else {
          reference = '';
          htmlAttributes = '';
          rubyAttributes = '';
          assignment = rest;
        }
        attributes = {};
        _ref4 = [this.parseAttributes(htmlAttributes), this.parseAttributes(rubyAttributes)];
        for (_j = 0, _len2 = _ref4.length; _j < _len2; _j++) {
          attr = _ref4[_j];
          for (key in attr) {
            val = attr[key];
            attributes[key] = val;
          }
        }
        if (whitespace = (_ref5 = assignment.match(/^[<>]{0,2}/)) != null ? _ref5[0] : void 0) {
          assignment = assignment.substring(whitespace.length);
        }
        if (assignment[0] === ' ') assignment = assignment.substring(1);
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
            var _k, _len3, _results;
            _results = [];
            for (_k = 0, _len3 = ids.length; _k < _len3; _k++) {
              id = ids[_k];
              _results.push("'" + (id.substr(1)) + "'");
            }
            return _results;
          })() : void 0,
          classes: classes ? (function() {
            var _k, _len3, _results;
            _results = [];
            for (_k = 0, _len3 = classes.length; _k < _len3; _k++) {
              klass = classes[_k];
              _results.push("'" + (klass.substr(1)) + "'");
            }
            return _results;
          })() : void 0,
          attributes: attributes,
          assignment: assignment,
          reference: reference,
          text: text
        };
      } catch (error) {
        throw "Unable to parse tag from " + exp + ": " + error;
      }
    };

    Haml.prototype.parseAttributes = function(exp) {
      var attributes, ch, endPos, hasDataAttribute, inDataAttribute, key, keyValue, keys, level, marker, markers, pairs, pos, quoted, start, startPos, type, value, _i, _len, _ref, _ref2, _ref3;
      attributes = {};
      if (exp === void 0) return attributes;
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
      for (pos = startPos; startPos <= endPos ? pos < endPos : pos > endPos; startPos <= endPos ? pos++ : pos--) {
        ch = exp[pos];
        if (ch === '(') {
          level += 1;
          if (level === 1) start = pos;
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
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        marker = _ref[_i];
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
        key = (_ref2 = keyValue[0]) != null ? _ref2.replace(/^\s+|\s+$/g, '').replace(/^:/, '') : void 0;
        if (quoted = key.match(/^("|')(.*)\1$/)) key = quoted[2];
        value = (_ref3 = keyValue[1]) != null ? _ref3.replace(/^\s+|[\s,]+$/g, '').replace(/\u0090/g, '') : void 0;
        if (key === 'data' && !value) {
          inDataAttribute = true;
          hasDataAttribute = true;
        } else if (key && value) {
          if (inDataAttribute) {
            key = "data-" + key;
            if (/}\s*$/.test(value)) inDataAttribute = false;
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
      if (hasDataAttribute) delete attributes['data'];
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
            name = this.interpolateCodeAttribute(name, true);
            if (name.indexOf('#{') !== -1) hasDynamicClass = true;
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
          classes = classes.substring(0, classes.length - 1) + '].sort().join(\' \').replace(/^\\s+|\\s+$/g, \'\') }';
        } else {
          classes = classList.sort().join(' ');
        }
        tagParts.push("class='" + classes + "'");
      }
      if (tokens.id) tagParts.push("id='" + tokens.id + "'");
      if (tokens.reference) {
        if (tokens.attributes) {
          delete tokens.attributes['class'];
          delete tokens.attributes['id'];
        }
        tagParts.push("\#{$r(" + tokens.reference + ")}");
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
            tagParts.push("" + key + "=" + (this.quoteAndEscapeAttributeValue(this.interpolateCodeAttribute(value))));
          }
        }
      }
      return tagParts.join(' ');
    };

    Haml.prototype.interpolateCodeAttribute = function(text, unwrap) {
      var quoted;
      if (unwrap == null) unwrap = false;
      if (!text) return;
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
      if (unwrap) if (quoted = text.match(/^("|')(.*)\1$/)) text = quoted[2];
      return text;
    };

    Haml.prototype.quoteAndEscapeAttributeValue = function(value, code) {
      var escaped, hasDoubleQuotes, hasInterpolation, hasSingleQuotes, quoted, result, token, tokens;
      if (code == null) code = false;
      if (!value) return;
      if (quoted = value.match(/^("|')(.*)\1$/)) value = quoted[2];
      tokens = this.splitInterpolations(value);
      hasSingleQuotes = false;
      hasDoubleQuotes = false;
      hasInterpolation = false;
      tokens = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = tokens.length; _i < _len; _i++) {
          token = tokens[_i];
          if (token.slice(0, 2) === '#{') {
            if (token.indexOf('$e') === -1 && token.indexOf('$c') === -1) {
              if (this.escapeAttributes) {
                if (this.cleanValue) {
                  token = '#{ $e($c(' + token.slice(2, -1) + ')) }';
                } else {
                  token = '#{ $e(' + token.slice(2, -1) + ') }';
                }
              } else {
                if (this.cleanValue) token = '#{ $c(' + token.slice(2, -1) + ') }';
              }
            }
            hasInterpolation = true;
          } else {
            if (!hasSingleQuotes) hasSingleQuotes = token.indexOf("'") !== -1;
            if (!hasDoubleQuotes) hasDoubleQuotes = token.indexOf('"') !== -1;
          }
          _results.push(token);
        }
        return _results;
      }).call(this);
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
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = tokens.length; _i < _len; _i++) {
              token = tokens[_i];
              _results.push(escapeQuotes(token));
            }
            return _results;
          })();
          result = "'" + (escaped.join('')) + "'";
        }
        if (hasSingleQuotes && hasDoubleQuotes) {
          escaped = (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = tokens.length; _i < _len; _i++) {
              token = tokens[_i];
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
      var ch, ch2, level, pos, start, tokens, _ref;
      level = 0;
      start = 0;
      tokens = [];
      for (pos = 0, _ref = value.length; 0 <= _ref ? pos < _ref : pos > _ref; 0 <= _ref ? pos++ : pos--) {
        ch = value[pos];
        ch2 = value.slice(pos, (pos + 1) + 1 || 9e9);
        if (ch === '{') level += 1;
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

  })();

}).call(this);

});

require.define("/nodes/code.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var Code, Node;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Node = require('./node');

  module.exports = Code = (function() {

    __extends(Code, Node);

    function Code() {
      Code.__super__.constructor.apply(this, arguments);
    }

    Code.prototype.evaluate = function() {
      var code, codeBlock, escape, identifier;
      codeBlock = this.expression.match(/(-|!=|\&=|=|~)\s?(.*)?/);
      identifier = codeBlock[1];
      code = codeBlock[2];
      if (identifier === '-') {
        this.opener = this.markRunningCode(code);
        if (this.children.length !== 0 && this.opener.code.match(/(->|=>)/)) {
          return this.closer = this.markRunningCode("  ''");
        }
      } else if (identifier === '~') {
        if (this.escapeHtml) {
          return this.opener = this.markInsertingCode(code, true, false, true);
        } else {
          return this.opener = this.markInsertingCode(code, false, false, true);
        }
      } else {
        escape = identifier === '&=' || (identifier === '=' && this.escapeHtml);
        if (this.children.length !== 0 && code.match(/(->|=>)$/)) {
          this.opener = this.markInsertingCode(code, escape, false, false);
          this.opener.block = 'start';
          this.closer = this.markRunningCode("  $buffer.join \"\\n\"");
          return this.closer.block = 'end';
        } else {
          return this.opener = this.markInsertingCode(code, escape);
        }
      }
    };

    return Code;

  })();

}).call(this);

});

require.define("/nodes/comment.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var Comment, Node, escapeQuotes;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Node = require('./node');

  escapeQuotes = require('../util/text').escapeQuotes;

  module.exports = Comment = (function() {

    __extends(Comment, Node);

    function Comment() {
      Comment.__super__.constructor.apply(this, arguments);
    }

    Comment.prototype.evaluate = function() {
      var comment, expression, identifier, _ref;
      _ref = this.expression.match(/(-#|\/\[|\/)\s?(.*)?/), expression = _ref[0], identifier = _ref[1], comment = _ref[2];
      switch (identifier) {
        case '-#':
          this.silent = true;
          return this.opener = this.markText('');
        case '\/[':
          this.opener = this.markText("<!--[" + comment + ">");
          return this.closer = this.markText('<![endif]-->');
        case '\/':
          if (comment) {
            this.opener = this.markText("<!-- " + (escapeQuotes(comment)));
            return this.closer = this.markText(' -->');
          } else {
            this.opener = this.markText("<!--");
            return this.closer = this.markText('-->');
          }
      }
    };

    return Comment;

  })();

}).call(this);

});

require.define("/nodes/filter.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var Filter, Node, unescapeQuotes, whitespace;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Node = require('./node');

  whitespace = require('../util/text').whitespace;

  unescapeQuotes = require('../util/text').unescapeQuotes;

  module.exports = Filter = (function() {

    __extends(Filter, Node);

    function Filter() {
      Filter.__super__.constructor.apply(this, arguments);
    }

    Filter.prototype.evaluate = function() {
      var _ref;
      return this.filter = (_ref = this.expression.match(/:(escaped|preserve|css|javascript|coffeescript|plain|cdata|coffeescript)(.*)?/)) != null ? _ref[1] : void 0;
    };

    Filter.prototype.render = function() {
      var child, indent, output, preserve, _i, _j, _len, _len2, _ref, _ref2;
      output = [];
      switch (this.filter) {
        case 'escaped':
          _ref = this.children;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            child = _ref[_i];
            output.push(this.markText(child.render()[0].text, true));
          }
          break;
        case 'preserve':
          preserve = '';
          _ref2 = this.children;
          for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
            child = _ref2[_j];
            preserve += "" + (child.render()[0].text) + "&#x000A;";
          }
          preserve = preserve.replace(/\&\#x000A;$/, '');
          output.push(this.markText(preserve));
          break;
        case 'plain':
          this.renderFilterContent(0, output);
          break;
        case 'css':
          if (this.format === 'html5') {
            output.push(this.markText('<style>'));
          } else {
            output.push(this.markText('<style type=\'text/css\'>'));
          }
          if (this.format === 'xhtml') {
            output.push(this.markText('  /*<![CDATA[*/'));
          }
          indent = this.format === 'xhtml' ? 2 : 1;
          this.renderFilterContent(indent, output);
          if (this.format === 'xhtml') output.push(this.markText('  /*]]>*/'));
          output.push(this.markText('</style>'));
          break;
        case 'javascript':
          if (this.format === 'html5') {
            output.push(this.markText('<script>'));
          } else {
            output.push(this.markText('<script type=\'text/javascript\'>'));
          }
          if (this.format === 'xhtml') output.push(this.markText('  //<![CDATA['));
          indent = this.format === 'xhtml' ? 2 : 1;
          this.renderFilterContent(indent, output);
          if (this.format === 'xhtml') output.push(this.markText('  //]]>'));
          output.push(this.markText('</script>'));
          break;
        case 'cdata':
          output.push(this.markText('<![CDATA['));
          this.renderFilterContent(2, output);
          output.push(this.markText(']]>'));
          break;
        case 'coffeescript':
          this.renderFilterContent(0, output, 'run');
      }
      return output;
    };

    Filter.prototype.renderFilterContent = function(indent, output, type) {
      var child, content, e, empty, line, _i, _j, _len, _len2, _ref, _results;
      if (type == null) type = 'text';
      content = [];
      empty = 0;
      _ref = this.children;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        child = _ref[_i];
        content.push(child.render()[0].text);
      }
      _results = [];
      for (_j = 0, _len2 = content.length; _j < _len2; _j++) {
        line = content[_j];
        if (line === '') {
          _results.push(empty += 1);
        } else {
          switch (type) {
            case 'text':
              for (e = 0; 0 <= empty ? e < empty : e > empty; 0 <= empty ? e++ : e--) {
                output.push(this.markText(""));
              }
              output.push(this.markText("" + (whitespace(indent)) + line));
              break;
            case 'run':
              output.push(this.markRunningCode("" + (unescapeQuotes(line))));
          }
          _results.push(empty = 0);
        }
      }
      return _results;
    };

    return Filter;

  })();

}).call(this);

});

require.define("/hamlc.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var CoffeeScript, Compiler, fs, __expressCache;

  fs = require('fs');

  Compiler = require('./haml-coffee');

  if (process.browser) {
    CoffeeScript = window.CoffeeScript;
  } else {
    CoffeeScript = require('coffee-script');
  }

  __expressCache = {};

  module.exports = {
    compile: function(source, options) {
      var compiler, template;
      if (options == null) options = {};
      compiler = new Compiler(options);
      compiler.parse(source);
      template = new Function(CoffeeScript.compile(compiler.precompile(), {
        bare: true
      }));
      return function(params) {
        return template.call(params);
      };
    },
    template: function(source, name, namespace, options) {
      var compiler;
      if (options == null) options = {};
      compiler = new Compiler(options);
      compiler.parse(source);
      return CoffeeScript.compile(compiler.render(name, namespace));
    },
    __express: function(filename, options, callback) {
      var source;
      if (!!(options && options.constructor && options.call && options.apply)) {
        callback = options;
        options = {};
      }
      try {
        if (options.cache && __expressCache[filename]) {
          return callback(null, __expressCache[filename](options));
        } else {
          options.filename = filename;
          source = fs.readFileSync(filename, 'utf8');
          if (options.cache) {
            __expressCache[filename] = module.exports.compile(source, options);
            return callback(null, __expressCache[filename](options));
          } else {
            return callback(null, module.exports.compile(source, options)(options));
          }
        }
      } catch (err) {
        return callback(err);
      }
    }
  };

}).call(this);

});

require.define("fs", function (require, module, exports, __dirname, __filename) {
// nothing to see here... no file methods for the browser

});
