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
    HamlCoffee.VERSION = '1.15.0';

    function HamlCoffee(options1) {
      var base, base1, base10, base11, base12, base13, base2, base3, base4, base5, base6, base7, base8, base9, j, len, segment, segments;
      this.options = options1 != null ? options1 : {};
      if ((base = this.options).placement == null) {
        base.placement = 'global';
      }
      if ((base1 = this.options).dependencies == null) {
        base1.dependencies = {
          hc: 'hamlcoffee'
        };
      }
      if ((base2 = this.options).escapeHtml == null) {
        base2.escapeHtml = true;
      }
      if ((base3 = this.options).escapeAttributes == null) {
        base3.escapeAttributes = true;
      }
      if ((base4 = this.options).cleanValue == null) {
        base4.cleanValue = true;
      }
      if ((base5 = this.options).uglify == null) {
        base5.uglify = false;
      }
      if ((base6 = this.options).basename == null) {
        base6.basename = false;
      }
      if ((base7 = this.options).extendScope == null) {
        base7.extendScope = false;
      }
      if ((base8 = this.options).format == null) {
        base8.format = 'html5';
      }
      if ((base9 = this.options).hyphenateDataAttrs == null) {
        base9.hyphenateDataAttrs = true;
      }
      if ((base10 = this.options).preserveTags == null) {
        base10.preserveTags = 'pre,textarea';
      }
      if ((base11 = this.options).selfCloseTags == null) {
        base11.selfCloseTags = 'meta,img,link,br,hr,input,area,param,col,base';
      }
      if (this.options.placement === 'global') {
        if ((base12 = this.options).name == null) {
          base12.name = 'test';
        }
        if ((base13 = this.options).namespace == null) {
          base13.namespace = 'window.HAML';
        }
        segments = (this.options.namespace + "." + this.options.name).replace(/(\s|-)+/g, '_').split(/\./);
        this.options.name = this.options.basename ? segments.pop().split(/\/|\\/).pop() : segments.pop();
        this.options.namespace = segments.shift();
        this.intro = '';
        if (segments.length !== 0) {
          for (j = 0, len = segments.length; j < len; j++) {
            segment = segments[j];
            this.options.namespace += "." + segment;
            this.intro += this.options.namespace + " ?= {}\n";
          }
        } else {
          this.intro += this.options.namespace + " ?= {}\n";
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
      if (!this.node) {
        throw new Error("Indentation error on line " + this.lineNumber);
      }
      this.currentBlockLevel = this.currentIndent / this.tabSize;
      if (!this.node.isCommented()) {
        if (this.currentBlockLevel - Math.floor(this.currentBlockLevel) > 0) {
          throw new Error("Indentation error on line " + this.lineNumber);
        }
        if ((this.currentIndent - this.previousIndent) / this.tabSize > 1) {
          throw new Error("Block level too deep on line " + this.lineNumber);
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
      var i, j, ref, results;
      results = [];
      for (i = j = 0, ref = this.delta - 1; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {
        results.push(this.parentNode = this.stack.pop());
      }
      return results;
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
        hyphenateDataAttrs: override.hyphenateDataAttrs || this.options.hyphenateDataAttrs,
        preserveTags: override.preserveTags || this.options.preserveTags,
        selfCloseTags: override.selfCloseTags || this.options.selfCloseTags,
        uglify: override.uglify || this.options.uglify,
        placement: override.placement || this.options.placement,
        namespace: override.namespace || this.options.namespace,
        name: override.name || this.options.name
      };
    };

    HamlCoffee.prototype.nodeFactory = function(expression) {
      var node, options, ref;
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
      if ((ref = options.parentNode) != null) {
        ref.addChild(node);
      }
      return node;
    };

    HamlCoffee.prototype.parse = function(source) {
      var attributes, expression, j, k, len, line, lines, range, ref, ref1, result, results, tabsize, text, ws;
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
              results = [];
              for (var j = ref = this.tabSize; ref <= 1 ? j <= 1 : j >= 1; ref <= 1 ? j++ : j--){ results.push(j); }
              return results;
            }).apply(this) : [2, 1];
            for (k = 0, len = range.length; k < len; k++) {
              tabsize = range[k];
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
          while (/^[%.#].*[{(]/.test(expression) && RegExp("^\\s{" + (this.previousIndent + (this.tabSize || 2)) + "}").test(lines[0]) && !/^(\s*)[-=&!~.%#<\/]/.test(lines[0]) && /([-\w]+[\w:-]*\w?)\s*=|('\w+[\w:-]*\w?')\s*=|("\w+[\w:-]*\w?")\s*=|(\w+[\w:-]*\w?):|('[-\w]+[\w:-]*\w?'):|("[-\w]+[\w:-]*\w?"):|:(\w+[\w:-]*\w?)\s*=>|:?'([-\w]+[\w:-]*\w?)'\s*=>|:?"([-\w]+[\w:-]*\w?)"\s*=>/.test(lines[0]) && !/;\s*$/.test(lines[0])) {
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
            while ((ref1 = lines[0]) != null ? ref1.match(/(\s)+\|$/) : void 0) {
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
      var child, j, len, ref;
      ref = node.children;
      for (j = 0, len = ref.length; j < len; j++) {
        child = ref[j];
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
      var m, module, modules, param, params, ref, ref1, template;
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
      ref = this.options.dependencies;
      for (param in ref) {
        module = ref[param];
        modules.push(module);
        params.push(param);
      }
      if (this.options.extendScope) {
        template = "  `with (context || {}) {`\n" + (indent(this.precompile(), 1)) + "\n`}`";
      } else {
        template = this.precompile();
      }
      ref1 = this.findDependencies(template);
      for (param in ref1) {
        module = ref1[param];
        modules.push(module);
        params.push(param);
      }
      if (modules.length !== 0) {
        modules = (function() {
          var j, len, results;
          results = [];
          for (j = 0, len = modules.length; j < len; j++) {
            m = modules[j];
            results.push("'" + m + "'");
          }
          return results;
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
        template += this.options.namespace + "['" + this.options.name + "'] = (context) -> ( ->\n";
        template += "  `with (context || {}) {`\n";
        template += "" + (indent(this.precompile(), 1));
        template += "`}`\n";
        template += ").call(context)";
      } else {
        template += this.options.namespace + "['" + this.options.name + "'] = (context) -> ( ->\n";
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
      fn += code + "\n";
      return fn += "return $o.join(\"\\n\")" + (this.convertBooleans(code)) + (this.removeEmptyIDAndClass(code)) + (this.cleanupWhitespace(code)) + "\n";
    };

    HamlCoffee.prototype.createCode = function() {
      var child, code, j, k, len, len1, line, processors, ref, ref1;
      code = [];
      this.lines = [];
      ref = this.root.children;
      for (j = 0, len = ref.length; j < len; j++) {
        child = ref[j];
        this.lines = this.lines.concat(child.render());
      }
      this.lines = this.combineText(this.lines);
      this.blockLevel = 0;
      ref1 = this.lines;
      for (k = 0, len1 = ref1.length; k < len1; k++) {
        line = ref1[k];
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
      var child, i, j, k, l, len, len1, len2, len3, len4, m, output, ref, ref1, ref2, ref3, ref4, rendered, tag;
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
            ref = this.children;
            for (i = 0, len = ref.length; i < len; i++) {
              child = ref[i];
              ref1 = child.render();
              for (j = 0, len1 = ref1.length; j < len1; j++) {
                rendered = ref1[j];
                rendered.hw = this.blockLevel;
                output.push(rendered);
              }
            }
            output.push(this.getCloser());
          } else {
            output.push(this.getOpener());
            ref2 = this.children;
            for (k = 0, len2 = ref2.length; k < len2; k++) {
              child = ref2[k];
              output = output.concat(child.render());
            }
            output.push(this.getCloser());
          }
        } else if (this.opener) {
          output.push(this.getOpener());
          ref3 = this.children;
          for (l = 0, len3 = ref3.length; l < len3; l++) {
            child = ref3[l];
            output = output.concat(child.render());
          }
        } else {
          ref4 = this.children;
          for (m = 0, len4 = ref4.length; m < len4; m++) {
            child = ref4[m];
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
  var Node, Text, escapeQuotes,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Node = require('./node');

  escapeQuotes = require('../util/text').escapeQuotes;

  module.exports = Text = (function(superClass) {
    extend(Text, superClass);

    function Text() {
      return Text.__super__.constructor.apply(this, arguments);
    }

    Text.prototype.evaluate = function() {
      return this.opener = this.markText(escapeQuotes(this.expression));
    };

    return Text;

  })(Node);

}).call(this);

});

require.define("/nodes/haml.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
  var Haml, Node, escapeQuotes,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Node = require('./node');

  escapeQuotes = require('../util/text').escapeQuotes;

  module.exports = Haml = (function(superClass) {
    extend(Haml, superClass);

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
            this.opener = this.markText(prefix + ">" + code);
            return this.closer = this.markText("</" + tokens.tag + ">");
          } else if (tokens.text) {
            this.opener = this.markText(prefix + ">" + tokens.text);
            return this.closer = this.markText("</" + tokens.tag + ">");
          } else {
            this.opener = this.markText(prefix + '>');
            return this.closer = this.markText("</" + tokens.tag + ">");
          }
        } else {
          tokens.tag = tokens.tag.replace(/\/$/, '');
          prefix = this.buildHtmlTagPrefix(tokens);
          if (tokens.text) {
            this.opener = this.markText(prefix + ">" + tokens.text);
            return this.closer = this.markText("</" + tokens.tag + ">");
          } else {
            return this.opener = this.markText("" + prefix + (this.format === 'xhtml' ? ' /' : '') + ">" + tokens.text);
          }
        }
      }
    };

    Haml.prototype.parseExpression = function(exp) {
      var attributes, classes, id, key, ref, ref1, tag, value;
      tag = this.parseTag(exp);
      if (this.preserveTags.indexOf(tag.tag) !== -1) {
        this.preserve = true;
      }
      id = this.interpolateCodeAttribute((ref = tag.ids) != null ? ref.pop() : void 0, true);
      classes = tag.classes;
      attributes = {};
      if (tag.attributes) {
        ref1 = tag.attributes;
        for (key in ref1) {
          value = ref1[key];
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
      var assignment, attr, attributes, ch, classes, doctype, end, error, haml, htmlAttributes, i, id, ids, j, k, key, klass, len, len1, level, pos, ref, ref1, ref2, ref3, ref4, reference, rest, rubyAttributes, start, tag, text, val, whitespace;
      try {
        doctype = (ref = exp.match(/^(\!{3}.*)/)) != null ? ref[1] : void 0;
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
          ref1 = ['[', '{', '(', '[', '{', '('];
          for (i = 0, len = ref1.length; i < len; i++) {
            start = ref1[i];
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
              for (pos = j = 0, ref2 = rest.length; 0 <= ref2 ? j <= ref2 : j >= ref2; pos = 0 <= ref2 ? ++j : --j) {
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
        ref3 = [this.parseAttributes(htmlAttributes), this.parseAttributes(rubyAttributes)];
        for (k = 0, len1 = ref3.length; k < len1; k++) {
          attr = ref3[k];
          for (key in attr) {
            val = attr[key];
            attributes[key] = val;
          }
        }
        if (whitespace = (ref4 = assignment.match(/^[<>]{0,2}/)) != null ? ref4[0] : void 0) {
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
            var l, len2, results;
            results = [];
            for (l = 0, len2 = ids.length; l < len2; l++) {
              id = ids[l];
              results.push("'" + (id.substr(1)) + "'");
            }
            return results;
          })() : void 0,
          classes: classes ? (function() {
            var l, len2, results;
            results = [];
            for (l = 0, len2 = classes.length; l < len2; l++) {
              klass = classes[l];
              results.push("'" + (klass.substr(1)) + "'");
            }
            return results;
          })() : void 0,
          attributes: attributes,
          assignment: assignment,
          reference: reference,
          text: text
        };
      } catch (error1) {
        error = error1;
        throw new Error("Unable to parse tag from " + exp + ": " + error);
      }
    };

    Haml.prototype.parseAttributes = function(exp) {
      var attr, attributes, ch, endPos, hasDataAttribute, i, inDataAttribute, j, k, key, keyValue, keys, len, len1, level, marker, markers, pairs, pos, quote, quoted, ref, ref1, ref2, ref3, ref4, ref5, ref6, start, startPos, type, value;
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
      for (pos = i = ref = startPos, ref1 = endPos; ref <= ref1 ? i < ref1 : i > ref1; pos = ref <= ref1 ? ++i : --i) {
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
      ref2 = markers.reverse();
      for (j = 0, len = ref2.length; j < len; j++) {
        marker = ref2[j];
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
          key = (ref3 = keyValue[0]) != null ? ref3.replace(/^\s+|\s+$/g, '').replace(/^:/, '') : void 0;
          if (quoted = key.match(/^("|')(.*)\1$/)) {
            key = quoted[2];
          }
          value = (ref4 = keyValue[1]) != null ? ref4.replace(/^\s+|[\s,]+$/g, '').replace(/\u0090/g, '') : void 0;
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
              quote = (ref5 = /^(['"])/.exec(value)) != null ? ref5[1] : void 0;
              pos = value.lastIndexOf(quote);
              if (pos > 1) {
                ref6 = value.substring(pos + 1).split(' ');
                for (k = 0, len1 = ref6.length; k < len1; k++) {
                  attr = ref6[k];
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
      var classList, classes, hasDynamicClass, i, key, klass, len, name, ref, tagParts, value;
      tagParts = ["<" + tokens.tag];
      if (tokens.classes) {
        hasDynamicClass = false;
        classList = (function() {
          var i, len, ref, results;
          ref = tokens.classes;
          results = [];
          for (i = 0, len = ref.length; i < len; i++) {
            name = ref[i];
            name = this.interpolateCodeAttribute(name, true);
            if (name.indexOf('#{') !== -1) {
              hasDynamicClass = true;
            }
            results.push(name);
          }
          return results;
        }).call(this);
        if (hasDynamicClass && classList.length > 1) {
          classes = '#{ [';
          for (i = 0, len = classList.length; i < len; i++) {
            klass = classList[i];
            classes += (this.quoteAndEscapeAttributeValue(klass, true)) + ",";
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
        ref = tokens.attributes;
        for (key in ref) {
          value = ref[key];
          if (value === 'true' || value === 'false') {
            if (value === 'true') {
              if (this.format === 'html5') {
                tagParts.push("" + key);
              } else {
                tagParts.push(key + "=" + (this.quoteAndEscapeAttributeValue(key)));
              }
            }
          } else {
            tagParts.push(key + "=" + (this.quoteAndEscapeAttributeValue(this.interpolateCodeAttribute(value))));
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
        var i, len, results;
        results = [];
        for (i = 0, len = tokens.length; i < len; i++) {
          token = tokens[i];
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
          results.push(token);
        }
        return results;
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
            var i, len, results;
            results = [];
            for (i = 0, len = tokens.length; i < len; i++) {
              token = tokens[i];
              results.push(escapeQuotes(token));
            }
            return results;
          })();
          result = "'" + (escaped.join('')) + "'";
        }
        if (hasSingleQuotes && hasDoubleQuotes) {
          escaped = (function() {
            var i, len, results;
            results = [];
            for (i = 0, len = tokens.length; i < len; i++) {
              token = tokens[i];
              results.push(escapeQuotes(token).replace(/'/g, '&#39;'));
            }
            return results;
          })();
          result = "'" + (escaped.join('')) + "'";
        }
      }
      return result;
    };

    Haml.prototype.splitInterpolations = function(value) {
      var ch, ch2, i, level, pos, ref, start, tokens;
      level = 0;
      start = 0;
      tokens = [];
      for (pos = i = 0, ref = value.length; 0 <= ref ? i < ref : i > ref; pos = 0 <= ref ? ++i : --i) {
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
      switch (this.format + " " + doctype) {
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
  var Code, Node,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Node = require('./node');

  module.exports = Code = (function(superClass) {
    extend(Code, superClass);

    function Code() {
      return Code.__super__.constructor.apply(this, arguments);
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
  var Comment, Node, escapeQuotes,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Node = require('./node');

  escapeQuotes = require('../util/text').escapeQuotes;

  module.exports = Comment = (function(superClass) {
    extend(Comment, superClass);

    function Comment() {
      return Comment.__super__.constructor.apply(this, arguments);
    }

    Comment.prototype.evaluate = function() {
      var comment, expression, identifier, ref;
      ref = this.expression.match(/(-#|\/\[|\/)\s?(.*)?/), expression = ref[0], identifier = ref[1], comment = ref[2];
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
  var Filter, Node, unescapeQuotes, whitespace,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Node = require('./node');

  whitespace = require('../util/text').whitespace;

  unescapeQuotes = require('../util/text').unescapeQuotes;

  module.exports = Filter = (function(superClass) {
    extend(Filter, superClass);

    function Filter() {
      return Filter.__super__.constructor.apply(this, arguments);
    }

    Filter.prototype.evaluate = function() {
      var ref;
      return this.filter = (ref = this.expression.match(/:(escaped|preserve|css|javascript|coffeescript|plain|cdata|coffeescript)(.*)?/)) != null ? ref[1] : void 0;
    };

    Filter.prototype.render = function() {
      var child, i, indent, j, len, len1, output, preserve, ref, ref1;
      output = [];
      switch (this.filter) {
        case 'escaped':
          ref = this.children;
          for (i = 0, len = ref.length; i < len; i++) {
            child = ref[i];
            output.push(this.markText(child.render()[0].text, true));
          }
          break;
        case 'preserve':
          preserve = '';
          ref1 = this.children;
          for (j = 0, len1 = ref1.length; j < len1; j++) {
            child = ref1[j];
            preserve += (child.render()[0].text) + "&#x000A;";
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
      var child, content, e, empty, i, j, k, len, len1, line, ref, ref1, results;
      if (type == null) {
        type = 'text';
      }
      content = [];
      empty = 0;
      ref = this.children;
      for (i = 0, len = ref.length; i < len; i++) {
        child = ref[i];
        content.push(child.render()[0].text);
      }
      results = [];
      for (j = 0, len1 = content.length; j < len1; j++) {
        line = content[j];
        if (line === '') {
          results.push(empty += 1);
        } else {
          switch (type) {
            case 'text':
              for (e = k = 0, ref1 = empty; 0 <= ref1 ? k < ref1 : k > ref1; e = 0 <= ref1 ? ++k : --k) {
                output.push(this.markText(""));
              }
              output.push(this.markText("" + (whitespace(indent)) + line));
              break;
            case 'run':
              output.push(this.markRunningCode("" + (unescapeQuotes(line))));
          }
          results.push(empty = 0);
        }
      }
      return results;
    };

    return Filter;

  })(Node);

}).call(this);

});

require.define("/nodes/directive.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
  var CoffeeScript, Directive, Node, fs, path,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  path = require('path');

  Node = require('./node');

  if (!process.browser) {
    fs = require('fs');
    CoffeeScript = require('coffee-script');
  }

  module.exports = Directive = (function(superClass) {
    extend(Directive, superClass);

    function Directive() {
      return Directive.__super__.constructor.apply(this, arguments);
    }

    Directive.prototype.directives = {
      include: function(expression) {
        var Compiler, code, compiler, context, e, error, name, ref, source, statement;
        try {
          ref = expression.match(/\s*['"](.*?)['"](?:,\s*(.*))?\s*/), ref[0], name = ref[1], context = ref[2];
        } catch (error1) {
          e = error1;
          throw new Error("Failed to parse the include directive from " + expression);
        }
        if (!context) {
          context = 'this';
        }
        statement = (function() {
          switch (this.placement) {
            case 'global':
              return this.namespace + "['" + name + "'](" + context + ")";
            case 'amd':
              return "require('" + name + "')(" + context + ")";
            case 'standalone':
              if (typeof browser !== "undefined" && browser !== null ? browser.process : void 0) {
                throw new Error("Include directive not available in the Browser when placement is standalone.");
              } else {
                try {
                  source = fs.readFileSync(name).toString();
                } catch (error1) {
                  error = error1;
                  console.error("  Error opening file: %s", error);
                  console.error(error);
                }
                Compiler = require('../haml-coffee');
                compiler = new Compiler(this.options);
                compiler.parse(source);
                code = CoffeeScript.compile(compiler.precompile(), {
                  bare: true
                });
                context = CoffeeScript.compile(context, {
                  bare: true
                }).replace(/;\s*$/, '');
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
      var directives, e, name, ref, rest;
      directives = Object.keys(this.directives).join('|');
      try {
        ref = this.expression.match(RegExp("\\+(" + directives + ")(.*)")), ref[0], name = ref[1], rest = ref[2];
      } catch (error1) {
        e = error1;
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
  var CoffeeScript, Compiler, __expressCache, fs;

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
      } catch (error) {
        err = error;
        return callback(err);
      }
    }
  };

}).call(this);

});
