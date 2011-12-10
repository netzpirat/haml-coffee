browserify = require 'browserify'
fs         = require 'fs'
jsp        = require("uglify-js").parser;
pro        = require("uglify-js").uglify;


task 'bundle', 'Compile the Haml Coffee compiler client JavaScript bundle', ->

  b = browserify()
  b.require "#{ __dirname }/lib/haml-coffee"

  code = b.bundle()
  fs.writeFileSync 'dist/hamlcoffee.js', code

  ast = jsp.parse code
  ast = pro.ast_mangle ast
  ast = pro.ast_squeeze ast

  min = pro.gen_code ast
  fs.writeFileSync 'dist/hamlcoffee.min.js', min
