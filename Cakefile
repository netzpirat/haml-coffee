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

generateGHPages = (cb) ->
  cloneGHPages = (cb) ->
    log "Clone gh-pages"
    exec 'git clone git@github.com:9elements/haml-coffee.git -b gh-pages /tmp/hamlcdoc', (err, stdout, stderr) ->
      onerror err
      log stdout
      cb err

  generateDocs = (cb) ->
    log "Generacte Haml-Coffee documentation"
    exec './node_modules/.bin/codo -o /tmp/hamlcdoc', (err, stdout, stderr) ->
      onerror err
      log stdout
      cb err

  pushDocs = (cb) ->
    log "Push site"
    exec 'cd /tmp/hamlcdoc && git add * . && git commit -am "Update to docs to latest version." && git push origin gh-pages', (err, stdout, stderr) ->
      onerror err
      log stdout
      cb err

  cleanUp = (cb) ->
    exec 'rm -rf /tmp/hamlcdoc', (err, stdout, stderr) ->
      onerror err
      log "Done."
      cb err

  series [
    cloneGHPages
    generateDocs
    pushDocs
    cleanUp
  ]

task 'pages', 'Generate the Haml-Coffee docs and push it to GitHub pages', -> generateGHPages onerror

publish = (cb) ->

  browserPackage = (cb) ->
    log "Create brower package"
    b = browserify()
    b.require "#{ __dirname }/lib/haml-coffee"

    code = b.bundle()
    fs.writeFileSync 'dist/compiler/hamlcoffee.js', code

    ast = sp.parse code
    ast = pro.ast_mangle ast
    ast = pro.ast_squeeze ast

    min = pro.gen_code ast
    fs.writeFileSync 'dist/compiler/hamlcoffee.min.js', min

    exec 'git commit -am "Generate latest browser package"', (err, stdout, stderr) ->
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
    generateGHPages
  ], cb

task 'publish', 'Prepare build and push new version to NPM', -> publish onerror
