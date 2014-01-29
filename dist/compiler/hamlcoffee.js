var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var cached = require.cache[resolved];
    var res = cached? cached.exports : mod();
    return res;
};

require.paths = [];
require.modules = {};
require.cache = {};
require.extensions = [".js",".coffee",".json"];

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
            x = path.normalize(x);
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
            var pkgfile = path.normalize(x + '/package.json');
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
        for (var key in obj) res.push(key);
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

(function () {
    var process = {};
    var global = typeof window !== 'undefined' ? window : {};
    var definedProcess = false;
    
    require.define = function (filename, fn) {
        if (!definedProcess && require.modules.__browserify_process) {
            process = require.modules.__browserify_process();
            definedProcess = true;
        }
        
        var dirname = require._core[filename]
            ? ''
            : require.modules.path().dirname(filename)
        ;
        
        var require_ = function (file) {
            var requiredModule = require(file, dirname);
            var cached = require.cache[require.resolve(file, dirname)];

            if (cached && cached.parent === null) {
                cached.parent = module_;
            }

            return requiredModule;
        };
        require_.resolve = function (name) {
            return require.resolve(name, dirname);
        };
        require_.modules = require.modules;
        require_.define = require.define;
        require_.cache = require.cache;
        var module_ = {
            id : filename,
            filename: filename,
            exports : {},
            loaded : false,
            parent: null
        };
        
        require.modules[filename] = function () {
            require.cache[filename] = module_;
            fn.call(
                module_.exports,
                require_,
                module_,
                module_.exports,
                dirname,
                filename,
                process,
                global
            );
            module_.loaded = true;
            return module_.exports;
        };
    };
})();


require.define("path",function(require,module,exports,__dirname,__filename,process,global){function filter (xs, fn) {
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

exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

});

require.define("__browserify_process",function(require,module,exports,__dirname,__filename,process,global){var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
        && window.setImmediate;
    var canPost = typeof window !== 'undefined'
        && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'browserify-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('browserify-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    if (name === 'evals') return (require)('vm')
    else throw new Error('No such module. (Possibly not yet loaded)')
};

(function () {
    var cwd = '/';
    var path;
    process.cwd = function () { return cwd };
    process.chdir = function (dir) {
        if (!path) path = require('path');
        cwd = path.resolve(dir, cwd);
    };
})();

});

require.define("/haml-coffee.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
  var Code, Comment, Directive, Filter, Haml, HamlCoffee, Node, Text, indent, whitespace;

  Node = require('./nodes/node');

  Text = require('./nodes/text');

  Haml = require('./nodes/haml');

  Code = require('./nodes/code');

  Comment = require('./nodes/comment');

  Filter = require('./nodes/filter');

  Directive = require('./nodes/directive');

  whitespace = require('./util/text').whitespace;

  indent = require('./util/text').indent;

  module.exports = HamlCoffee = (function() {
    HamlCoffee.VERSION = '1.14.1';

    function HamlCoffee(options) {
      var segment, segments, _base, _base1, _base10, _base11, _base12, _base13, _base2, _base3, _base4, _base5, _base6, _base7, _base8, _base9, _i, _len;
      this.options = options != null ? options : {};
      if ((_base = this.options).placement == null) {
        _base.placement = 'global';
      }
      if ((_base1 = this.options).dependencies == null) {
        _base1.dependencies = {
          hc: 'hamlcoffee'
        };
      }
      if ((_base2 = this.options).escapeHtml == null) {
        _base2.escapeHtml = true;
      }
      if ((_base3 = this.options).escapeAttributes == null) {
        _base3.escapeAttributes = true;
      }
      if ((_base4 = this.options).cleanValue == null) {
        _base4.cleanValue = true;
      }
      if ((_base5 = this.options).uglify == null) {
        _base5.uglify = false;
      }
      if ((_base6 = this.options).basename == null) {
        _base6.basename = false;
      }
      if ((_base7 = this.options).extendScope == null) {
        _base7.extendScope = false;
      }
      if ((_base8 = this.options).format == null) {
        _base8.format = 'html5';
      }
      if ((_base9 = this.options).hyphenateDataAttrs == null) {
        _base9.hyphenateDataAttrs = true;
      }
      if ((_base10 = this.options).preserveTags == null) {
        _base10.preserveTags = 'pre,textarea';
      }
      if ((_base11 = this.options).selfCloseTags == null) {
        _base11.selfCloseTags = 'meta,img,link,br,hr,input,area,param,col,base';
      }
      if (this.options.placement === 'global') {
        if ((_base12 = this.options).name == null) {
          _base12.name = 'test';
        }
        if ((_base13 = this.options).namespace == null) {
          _base13.namespace = 'window.HAML';
        }
        segments = ("" + this.options.namespace + "." + this.options.name).replace(/(\s|-)+/g, '_').split(/\./);
        this.options.name = this.options.basename ? segments.pop().split(/\/|\\/).pop() : segments.pop();
        this.options.namespace = segments.shift();
        this.intro = '';
        if (segments.length !== 0) {
          for (_i = 0, _len = segments.length; _i < _len; _i++) {
            segment = segments[_i];
            this.options.namespace += "." + segment;
            this.intro += "" + this.options.namespace + " ?= {}\n";
          }
        } else {
          this.intro += "" + this.options.namespace + " ?= {}\n";
        }
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
      if (!this.node.isCommented()) {
        if (this.currentBlockLevel - Math.floor(this.currentBlockLevel) > 0) {
          throw "Indentation error in line " + this.lineNumber;
        }
        if ((this.currentIndent - this.previousIndent) / this.tabSize > 1) {
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
      var i, _i, _ref, _results;
      _results = [];
      for (i = _i = 0, _ref = this.delta - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
        _results.push(this.parentNode = this.stack.pop());
      }
      return _results;
    };

    HamlCoffee.prototype.getNodeOptions = function(override) {
      if (override == null) {
        override = {};
      }
      return {
        parentNode: override.parentNode || this.parentNode,
        blockLevel: override.blockLevel || this.currentBlockLevel,
        codeBlockLevel: override.codeBlockLevel || this.currentCodeBlockLevel,
        escapeHtml: override.escapeHtml || this.options.escapeHtml,
        escapeAttributes: override.escapeAttributes || this.options.escapeAttributes,
        cleanValue: override.cleanValue || this.options.cleanValue,
        format: override.format || this.options.format,
        hyphenateDataAttrs: override.hyphenateDataAttrs || this.options.format,
        preserveTags: override.preserveTags || this.options.preserveTags,
        selfCloseTags: override.selfCloseTags || this.options.selfCloseTags,
        uglify: override.uglify || this.options.uglify,
        placement: override.placement || this.options.placement,
        namespace: override.namespace || this.options.namespace,
        name: override.name || this.options.name
      };
    };

    HamlCoffee.prototype.nodeFactory = function(expression) {
      var node, options, _ref;
      if (expression == null) {
        expression = '';
      }
      options = this.getNodeOptions();
      if (expression.match(/^:(escaped|preserve|css|javascript|plain|cdata|coffeescript)/)) {
        node = new Filter(expression, options);
      } else if (expression.match(/^(\/|-#)(.*)/)) {
        node = new Comment(expression, options);
      } else if (expression.match(/^(-#|-|=|!=|\&=|~)\s*(.*)/)) {
        node = new Code(expression, options);
      } else if (expression.match(/^(%|#[^{]|\.|\!)(.*)/)) {
        node = new Haml(expression, options);
      } else if (expression.match(/^\+(.*)/)) {
        node = new Directive(expression, options);
      } else {
        node = new Text(expression, options);
      }
      if ((_ref = options.parentNode) != null) {
        _ref.addChild(node);
      }
      return node;
    };

    HamlCoffee.prototype.parse = function(source) {
      var attributes, expression, line, lines, range, result, tabsize, text, ws, _i, _j, _len, _ref, _ref1, _results;
      if (source == null) {
        source = '';
      }
      this.lineNumber = this.previousIndent = this.tabSize = this.currentBlockLevel = this.previousBlockLevel = 0;
      this.currentCodeBlockLevel = this.previousCodeBlockLevel = 0;
      this.node = null;
      this.stack = [];
      this.root = this.parentNode = new Node('', this.getNodeOptions());
      lines = source.replace(/\r/g, '').split("\n");
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
            range = this.tabSize > 2 ? (function() {
              _results = [];
              for (var _i = _ref = this.tabSize; _ref <= 1 ? _i <= 1 : _i >= 1; _ref <= 1 ? _i++ : _i--){ _results.push(_i); }
              return _results;
            }).apply(this) : [2, 1];
            for (_j = 0, _len = range.length; _j < _len; _j++) {
              tabsize = range[_j];
              text = line.match(RegExp("^\\s{" + ((this.node.blockLevel * tabsize) + tabsize) + "}(.*)"));
              if (text) {
                this.node.addChild(new Text(text[1], this.getNodeOptions({
                  parentNode: this.node
                })));
                break;
              }
            }
          }
        } else {
          this.exitFilter = false;
          result = line.match(/^(\s*)(.*)/);
          ws = result[1];
          expression = result[2];
          this.currentIndent = ws.length;
          if (/^\s*$/.test(line)) {
            continue;
          }
          while (/^[%.#].*[{(]/.test(expression) && RegExp("^\\s{" + (this.previousIndent + (this.tabSize || 2)) + "}").test(lines[0]) && !/^(\s*)[-=&!~.%#</]/.test(lines[0]) && /([-\w]+[\w:-]*\w?)\s*=|('\w+[\w:-]*\w?')\s*=|("\w+[\w:-]*\w?")\s*=|(\w+[\w:-]*\w?):|('[-\w]+[\w:-]*\w?'):|("[-\w]+[\w:-]*\w?"):|:(\w+[\w:-]*\w?)\s*=>|:?'([-\w]+[\w:-]*\w?)'\s*=>|:?"([-\w]+[\w:-]*\w?)"\s*=>/.test(lines[0]) && !/;\s*$/.test(lines[0])) {
            attributes = lines.shift();
            expression = expression.replace(/(\s)+\|\s*$/, '');
            expression += ' ' + attributes.match(/^\s*(.*?)(\s+\|\s*)?$/)[1];
            this.lineNumber++;
          }
          while (/^-#/.test(expression) && RegExp("^\\s{" + (this.currentIndent + (this.tabSize || 2)) + "}").test(lines[0]) && lines.length > 0) {
            lines.shift();
            this.lineNumber++;
          }
          if (expression.match(/(\s)+\|\s*$/)) {
            expression = expression.replace(/(\s)+\|\s*$/, ' ');
            while ((_ref1 = lines[0]) != null ? _ref1.match(/(\s)+\|$/) : void 0) {
              expression += lines.shift().match(/^(\s*)(.*)/)[2].replace(/(\s)+\|\s*$/, '');
              this.lineNumber++;
            }
          }
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

    HamlCoffee.prototype.render = function() {
      switch (this.options.placement) {
        case 'amd':
          return this.renderAmd();
        case 'standalone':
          return this.renderStandalone();
        default:
          return this.renderGlobal();
      }
    };

    HamlCoffee.prototype.renderStandalone = function() {
      var template;
      return template = "return (context) ->\n  (->\n" + (indent(this.precompile(), 2)) + "\n  ).call(context)";
    };

    HamlCoffee.prototype.renderAmd = function() {
      var m, module, modules, param, params, template, _ref, _ref1;
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
      if (this.options.extendScope) {
        template = "  `with (context || {}) {`\n" + (indent(this.precompile(), 1)) + "\n`}`";
      } else {
        template = this.precompile();
      }
      _ref1 = this.findDependencies(template);
      for (param in _ref1) {
        module = _ref1[param];
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
      return "define " + modules + " ->\n  (context) ->\n    render = ->\n      \n" + (indent(template, 4)) + "\n    render.call(context)";
    };

    HamlCoffee.prototype.renderGlobal = function() {
      var template;
      template = this.intro;
      if (this.options.extendScope) {
        template += "" + this.options.namespace + "['" + this.options.name + "'] = (context) -> ( ->\n";
        template += "  `with (context || {}) {`\n";
        template += "" + (indent(this.precompile(), 1));
        template += "`}`\n";
        template += ").call(context)";
      } else {
        template += "" + this.options.namespace + "['" + this.options.name + "'] = (context) -> ( ->\n";
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
          fn += "surround = (start, end, fn) => start + fn.call(@)?.replace(/^\\s+|\\s+$/g, '') + end\n";
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
      var child, code, line, processors, _i, _j, _len, _len1, _ref, _ref1;
      code = [];
      this.lines = [];
      _ref = this.root.children;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        child = _ref[_i];
        this.lines = this.lines.concat(child.render());
      }
      this.lines = this.combineText(this.lines);
      this.blockLevel = 0;
      _ref1 = this.lines;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        line = _ref1[_j];
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
              if (line.findAndPreserve) {
                processors += '$fp ';
              }
              if (line.preserve) {
                processors += '$p ';
              }
              if (line.escape) {
                processors += '$e ';
              }
              if (this.options.cleanValue) {
                processors += '$c ';
              }
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
          return '.replace(/\\s([\\w-]+)=\'\u0093true\'/mg, " $1=\'$1\'").replace(/\\s([\\w-]+)=\'\u0093false\'/mg, \'\')';
        } else {
          return '.replace(/\\s([\\w-]+)=\'\u0093true\'/mg, \' $1\').replace(/\\s([\\w-]+)=\'\u0093false\'/mg, \'\')';
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

require.define("/nodes/node.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
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
      this.hyphenateDataAttrs = options.hyphenateDataAttrs;
      this.selfCloseTags = options.selfCloseTags.split(',');
      this.uglify = options.uglify;
      this.codeBlockLevel = options.codeBlockLevel;
      this.blockLevel = options.blockLevel;
      this.placement = options.placement;
      this.namespace = options.namespace;
      this.name = options.name;
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

});

require.define("/util/text.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
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
        code.replace(/\r/g, '');
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

});

require.define("/nodes/text.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
  var Node, Text, escapeQuotes, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Node = require('./node');

  escapeQuotes = require('../util/text').escapeQuotes;

  module.exports = Text = (function(_super) {
    __extends(Text, _super);

    function Text() {
      _ref = Text.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Text.prototype.evaluate = function() {
      return this.opener = this.markText(escapeQuotes(this.expression));
    };

    return Text;

  })(Node);

}).call(this);

});

require.define("/nodes/haml.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
  var Haml, Node, escapeQuotes, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Node = require('./node');

  escapeQuotes = require('../util/text').escapeQuotes;

  module.exports = Haml = (function(_super) {
    __extends(Haml, _super);

    function Haml() {
      _ref = Haml.__super__.constructor.apply(this, arguments);
      return _ref;
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
          if (tokens.text) {
            this.opener = this.markText("" + prefix + ">" + tokens.text);
            return this.closer = this.markText("</" + tokens.tag + ">");
          } else {
            return this.opener = this.markText("" + prefix + (this.format === 'xhtml' ? ' /' : '') + ">" + tokens.text);
          }
        }
      }
    };

    Haml.prototype.parseExpression = function(exp) {
      var attributes, classes, id, key, tag, value, _ref1, _ref2;
      tag = this.parseTag(exp);
      if (this.preserveTags.indexOf(tag.tag) !== -1) {
        this.preserve = true;
      }
      id = this.interpolateCodeAttribute((_ref1 = tag.ids) != null ? _ref1.pop() : void 0, true);
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
      var assignment, attr, attributes, ch, classes, doctype, end, error, haml, htmlAttributes, id, ids, key, klass, level, pos, reference, rest, rubyAttributes, start, tag, text, val, whitespace, _i, _j, _k, _len, _len1, _ref1, _ref2, _ref3, _ref4, _ref5;
      try {
        doctype = (_ref1 = exp.match(/^(\!{3}.*)/)) != null ? _ref1[1] : void 0;
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
              for (pos = _j = 0, _ref3 = rest.length; 0 <= _ref3 ? _j <= _ref3 : _j >= _ref3; pos = 0 <= _ref3 ? ++_j : --_j) {
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
        for (_k = 0, _len1 = _ref4.length; _k < _len1; _k++) {
          attr = _ref4[_k];
          for (key in attr) {
            val = attr[key];
            attributes[key] = val;
          }
        }
        if (whitespace = (_ref5 = assignment.match(/^[<>]{0,2}/)) != null ? _ref5[0] : void 0) {
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
            var _l, _len2, _results;
            _results = [];
            for (_l = 0, _len2 = ids.length; _l < _len2; _l++) {
              id = ids[_l];
              _results.push("'" + (id.substr(1)) + "'");
            }
            return _results;
          })() : void 0,
          classes: classes ? (function() {
            var _l, _len2, _results;
            _results = [];
            for (_l = 0, _len2 = classes.length; _l < _len2; _l++) {
              klass = classes[_l];
              _results.push("'" + (klass.substr(1)) + "'");
            }
            return _results;
          })() : void 0,
          attributes: attributes,
          assignment: assignment,
          reference: reference,
          text: text
        };
      } catch (_error) {
        error = _error;
        throw new Error("Unable to parse tag from " + exp + ": " + error);
      }
    };

    Haml.prototype.parseAttributes = function(exp) {
      var attr, attributes, ch, endPos, hasDataAttribute, inDataAttribute, key, keyValue, keys, level, marker, markers, pairs, pos, quote, quoted, start, startPos, type, value, _i, _j, _k, _len, _len1, _ref1, _ref2, _ref3, _ref4, _ref5;
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
          if (level === 1) {
            start = pos;
          }
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
      _ref1 = markers.reverse();
      for (_j = 0, _len = _ref1.length; _j < _len; _j++) {
        marker = _ref1[_j];
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
        if (keyValue.length === 1) {
          attr = keyValue[0].replace(/^[\s({]+|[\s)}]+$/g, '');
          attributes[attr] = 'true';
        } else {
          key = (_ref2 = keyValue[0]) != null ? _ref2.replace(/^\s+|\s+$/g, '').replace(/^:/, '') : void 0;
          if (quoted = key.match(/^("|')(.*)\1$/)) {
            key = quoted[2];
          }
          value = (_ref3 = keyValue[1]) != null ? _ref3.replace(/^\s+|[\s,]+$/g, '').replace(/\u0090/g, '') : void 0;
          if (key === 'data' && !value) {
            inDataAttribute = true;
            hasDataAttribute = true;
          } else if (key && value) {
            if (inDataAttribute) {
              key = this.hyphenateDataAttrs ? "data-" + (key.replace('_', '-')) : "data-" + key;
              if (/}\s*$/.test(value)) {
                inDataAttribute = false;
              }
            }
          }
          switch (type) {
            case '(':
              value = value.replace(/^\s+|[\s)]+$/g, '');
              quote = (_ref4 = /^(['"])/.exec(value)) != null ? _ref4[1] : void 0;
              pos = value.lastIndexOf(quote);
              if (pos > 1) {
                _ref5 = value.substring(pos + 1).split(' ');
                for (_k = 0, _len1 = _ref5.length; _k < _len1; _k++) {
                  attr = _ref5[_k];
                  if (attr) {
                    attributes[attr] = 'true';
                  }
                }
                value = value.substring(0, pos + 1);
              }
              attributes[key] = value;
              break;
            case '{':
              attributes[key] = value.replace(/^\s+|[\s}]+$/g, '');
          }
        }
      }
      if (hasDataAttribute) {
        delete attributes['data'];
      }
      return attributes;
    };

    Haml.prototype.buildHtmlTagPrefix = function(tokens) {
      var classList, classes, hasDynamicClass, key, klass, name, tagParts, value, _i, _len, _ref1;
      tagParts = ["<" + tokens.tag];
      if (tokens.classes) {
        hasDynamicClass = false;
        classList = (function() {
          var _i, _len, _ref1, _results;
          _ref1 = tokens.classes;
          _results = [];
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            name = _ref1[_i];
            name = this.interpolateCodeAttribute(name, true);
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
          classes = classes.substring(0, classes.length - 1) + '].sort().join(\' \').replace(/^\\s+|\\s+$/g, \'\') }';
        } else {
          classes = classList.sort().join(' ');
        }
        tagParts.push("class='" + classes + "'");
      }
      if (tokens.id) {
        tagParts.push("id='" + tokens.id + "'");
      }
      if (tokens.reference) {
        if (tokens.attributes) {
          delete tokens.attributes['class'];
          delete tokens.attributes['id'];
        }
        tagParts.push("\#{$r(" + tokens.reference + ")}");
      }
      if (tokens.attributes) {
        _ref1 = tokens.attributes;
        for (key in _ref1) {
          value = _ref1[key];
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
      var escaped, hasDoubleQuotes, hasInterpolation, hasSingleQuotes, quoted, result, token, tokens;
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
                if (this.cleanValue) {
                  token = '#{ $c(' + token.slice(2, -1) + ') }';
                }
              }
            }
            hasInterpolation = true;
          } else {
            if (!hasSingleQuotes) {
              hasSingleQuotes = token.indexOf("'") !== -1;
            }
            if (!hasDoubleQuotes) {
              hasDoubleQuotes = token.indexOf('"') !== -1;
            }
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
      var ch, ch2, level, pos, start, tokens, _i, _ref1;
      level = 0;
      start = 0;
      tokens = [];
      for (pos = _i = 0, _ref1 = value.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; pos = 0 <= _ref1 ? ++_i : --_i) {
        ch = value[pos];
        ch2 = value.slice(pos, +(pos + 1) + 1 || 9e9);
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
            tokens.push(value.slice(start, +pos + 1 || 9e9));
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

});

require.define("/nodes/code.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
  var Code, Node, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Node = require('./node');

  module.exports = Code = (function(_super) {
    __extends(Code, _super);

    function Code() {
      _ref = Code.__super__.constructor.apply(this, arguments);
      return _ref;
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

  })(Node);

}).call(this);

});

require.define("/nodes/comment.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
  var Comment, Node, escapeQuotes, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Node = require('./node');

  escapeQuotes = require('../util/text').escapeQuotes;

  module.exports = Comment = (function(_super) {
    __extends(Comment, _super);

    function Comment() {
      _ref = Comment.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Comment.prototype.evaluate = function() {
      var comment, expression, identifier, _ref1;
      _ref1 = this.expression.match(/(-#|\/\[|\/)\s?(.*)?/), expression = _ref1[0], identifier = _ref1[1], comment = _ref1[2];
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

  })(Node);

}).call(this);

});

require.define("/nodes/filter.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
  var Filter, Node, unescapeQuotes, whitespace, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Node = require('./node');

  whitespace = require('../util/text').whitespace;

  unescapeQuotes = require('../util/text').unescapeQuotes;

  module.exports = Filter = (function(_super) {
    __extends(Filter, _super);

    function Filter() {
      _ref = Filter.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Filter.prototype.evaluate = function() {
      var _ref1;
      return this.filter = (_ref1 = this.expression.match(/:(escaped|preserve|css|javascript|coffeescript|plain|cdata|coffeescript)(.*)?/)) != null ? _ref1[1] : void 0;
    };

    Filter.prototype.render = function() {
      var child, indent, output, preserve, _i, _j, _len, _len1, _ref1, _ref2;
      output = [];
      switch (this.filter) {
        case 'escaped':
          _ref1 = this.children;
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            child = _ref1[_i];
            output.push(this.markText(child.render()[0].text, true));
          }
          break;
        case 'preserve':
          preserve = '';
          _ref2 = this.children;
          for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
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
          if (this.format === 'xhtml') {
            output.push(this.markText('  /*]]>*/'));
          }
          output.push(this.markText('</style>'));
          break;
        case 'javascript':
          if (this.format === 'html5') {
            output.push(this.markText('<script>'));
          } else {
            output.push(this.markText('<script type=\'text/javascript\'>'));
          }
          if (this.format === 'xhtml') {
            output.push(this.markText('  //<![CDATA['));
          }
          indent = this.format === 'xhtml' ? 2 : 1;
          this.renderFilterContent(indent, output);
          if (this.format === 'xhtml') {
            output.push(this.markText('  //]]>'));
          }
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
      var child, content, e, empty, line, _i, _j, _k, _len, _len1, _ref1, _results;
      if (type == null) {
        type = 'text';
      }
      content = [];
      empty = 0;
      _ref1 = this.children;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        child = _ref1[_i];
        content.push(child.render()[0].text);
      }
      _results = [];
      for (_j = 0, _len1 = content.length; _j < _len1; _j++) {
        line = content[_j];
        if (line === '') {
          _results.push(empty += 1);
        } else {
          switch (type) {
            case 'text':
              for (e = _k = 0; 0 <= empty ? _k < empty : _k > empty; e = 0 <= empty ? ++_k : --_k) {
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

  })(Node);

}).call(this);

});

require.define("/nodes/directive.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
  var CoffeeScript, Directive, Node, fs, path, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  path = require('path');

  Node = require('./node');

  if (!process.browser) {
    fs = require('fs');
    CoffeeScript = require('coffee-script');
  }

  module.exports = Directive = (function(_super) {
    __extends(Directive, _super);

    function Directive() {
      _ref = Directive.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Directive.prototype.directives = {
      include: function(expression) {
        var Compiler, code, compiler, context, e, error, name, source, statement, _ref1;
        try {
          _ref1 = expression.match(/\s*['"](.*?)['"](?:,\s*(.*))?\s*/), _ref1[0], name = _ref1[1], context = _ref1[2];
        } catch (_error) {
          e = _error;
          throw new Error("Failed to parse the include directive from " + expression);
        }
        if (!context) {
          context = 'this';
        }
        statement = (function() {
          switch (this.placement) {
            case 'global':
              return "" + this.namespace + "['" + name + "'](" + context + ")";
            case 'amd':
              return "require('" + name + "')(" + context + ")";
            case 'standalone':
              if (typeof browser !== "undefined" && browser !== null ? browser.process : void 0) {
                throw new Error("Include directive not available in the Browser when placement is standalone.");
              } else {
                try {
                  source = fs.readFileSync(name).toString();
                } catch (_error) {
                  error = _error;
                  console.error("  Error opening file: %s", error);
                  console.error(error);
                }
                Compiler = require('../haml-coffee');
                compiler = new Compiler(this.options);
                compiler.parse(source);
                code = CoffeeScript.compile(compiler.precompile(), {
                  bare: true
                });
                return statement = "`(function(){" + code + "}).apply(" + context + ")`";
              }
              break;
            default:
              throw new Error("Include directive not available when placement is " + this.placement);
          }
        }).call(this);
        return this.opener = this.markInsertingCode(statement, false);
      }
    };

    Directive.prototype.evaluate = function() {
      var directives, e, name, rest, _ref1;
      directives = Object.keys(this.directives).join('|');
      try {
        _ref1 = this.expression.match(RegExp("\\+(" + directives + ")(.*)")), _ref1[0], name = _ref1[1], rest = _ref1[2];
      } catch (_error) {
        e = _error;
        throw new Error("Unable to recognize directive from " + this.expression);
      }
      return this.directives[name].call(this, rest);
    };

    return Directive;

  })(Node);

}).call(this);

});

require.define("fs",function(require,module,exports,__dirname,__filename,process,global){// nothing to see here... no file methods for the browser

});

require.define("/hamlc.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
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
    render: function(source, context, options) {
      var compiler, template;
      if (context == null) {
        context = {};
      }
      if (options == null) {
        options = {};
      }
      options.placement = 'standalone';
      compiler = new Compiler(options);
      compiler.parse(source);
      template = new Function(CoffeeScript.compile(compiler.precompile(), {
        bare: true
      }));
      return template.call(context);
    },
    compile: function(source, options) {
      var compiler, template;
      if (options == null) {
        options = {};
      }
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
      if (options == null) {
        options = {};
      }
      options.namespace = namespace;
      options.name = name;
      compiler = new Compiler(options);
      compiler.parse(source);
      return CoffeeScript.compile(compiler.render());
    },
    __express: function(filename, options, callback) {
      var err, source;
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
      } catch (_error) {
        err = _error;
        return callback(err);
      }
    }
  };

}).call(this);

});
