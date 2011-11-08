assert = require 'assert'
should = require 'should'
fs     = require 'fs'

CoffeeScript  = require 'coffee-script'
Compiler      = require '../lib/compiler'

suite = JSON.parse fs.readFileSync('test/haml_spec.json')

for group, specs of suite
  for desc, spec of specs
    do (desc, spec) ->

      module.exports["#{ group }: #{ desc }"] = ->

        compiler = new Compiler
          escape_html: spec.config?.escape_html || false
          format: spec.config?.format || 'xhtml'

        # Locals are differently implemented in haml-coffee:
        # instead of `local` it must be `@local`
        haml = spec.haml
        for key, value of spec.locals
          haml = haml.replace(key, "@#{ key }")

        console.log haml

        compiler.parse haml
        cs_template = compiler.render 'test'
        console.log(cs_template)
        template = CoffeeScript.compile cs_template

        window = {}
        eval template

        window.HAML.test(spec.locals).should.eql(spec.html)
        return
