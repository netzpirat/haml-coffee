browserify = require 'browserify'
fs         = require 'fs'
jsp        = require('uglify-js').parser
pro        = require('uglify-js').uglify
sys        = require 'sys'
{spawn}    = require 'child_process'

task 'watch', 'Watch src directory and build to lib', ->
  coffee = spawn 'coffee', ['--lint', '--output', 'lib', '--watch', 'src']

  coffee.stdout.on 'data', (data) -> sys.print data.toString()
  coffee.stderr.on 'data', (data) -> sys.print data.toString()

task 'bundle', 'Compile the Haml Coffee compiler client JavaScript bundle', ->

  b = browserify()
  b.require "#{ __dirname }/lib/haml-coffee"

  code = b.bundle()
  fs.writeFileSync 'dist/compiler/hamlcoffee.js', code

  ast = jsp.parse code
  ast = pro.ast_mangle ast
  ast = pro.ast_squeeze ast

  min = pro.gen_code ast
  fs.writeFileSync 'dist/compiler/hamlcoffee.min.js', min
