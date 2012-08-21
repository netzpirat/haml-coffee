browserify = require 'browserify'
fs         = require 'fs'
sp         = require('uglify-js').parser
pro        = require('uglify-js').uglify
{series}   = require 'async'
{exec}     = require 'child_process'

process.env['PATH'] = "node_modules/.bin:#{ process.env['PATH'] }"

bold  = '\x1b[0;1m'
red   = '\x1b[0;31m'
green = '\x1b[0;32m'
reset = '\x1b[0m'

log = (message, color = green) -> console.log "#{ color }#{ message }#{ reset }"

onerror = (err) ->
  if err
    process.stdout.write "#{ red }#{ err.stack }#{ reset }\n"
    process.exit -1

test = (cb) ->
  exec 'jasmine-node --coffee spec', (err, stdout, stderr) ->
    msg = /(\d+) tests?, (\d+) assertions?, (\d+) failures?/
    matches = stdout.match msg || stderr.match msg
    cb new Error('Tests failed') if matches[3] != '0'
    log matches[0]
    cb err

task 'test', 'Run all tests', -> test onerror

publish = (cb) ->

  browserPackage = (cb) ->
    fs.readFile 'package.json', 'utf8', (err, p) ->
      onerror err
      p = JSON.parse p
      throw new Exception 'Invalid package.json' if !p.version

      log "Update compiler dist for  #{ p.version }"
      b = browserify()
      b.ignore 'coffee-script'
      b.require "#{ __dirname }/src/haml-coffee.coffee"
      b.require "#{ __dirname }/src/hamlc.coffee"

      code = b.bundle()
      fs.writeFileSync 'dist/compiler/hamlcoffee.js', code

      ast = sp.parse code
      ast = pro.ast_mangle ast
      ast = pro.ast_squeeze ast

      min = pro.gen_code ast
      fs.writeFileSync 'dist/compiler/hamlcoffee.min.js', min

      exec "git commit -am 'Update compiler dist for #{ p.version }'", (err, stdout, stderr) ->
        log stdout
        cb err

  npmPublish = (cb) ->
    log 'Publishing to NPM'
    exec 'npm publish', (err, stdout, stderr) ->
      log stdout
      cb err

  tagVersion = (cb) ->
    fs.readFile 'package.json', 'utf8', (err, p) ->
      onerror err
      p = JSON.parse p
      throw new Exception 'Invalid package.json' if !p.version
      log "Tagging v#{ p.version }"
      exec "git tag v#{ p.version }", (err, stdout, stderr) ->
        log stdout
        cb err

  pushGithub = (cb) ->
    exec 'git push --tag origin master', (err, stdout, stderr) ->
      log stdout
      cb err

  series [
    test
    browserPackage
    tagVersion
    pushGithub
    npmPublish
  ], cb

task 'publish', 'Prepare build and push new version to NPM', -> publish onerror
