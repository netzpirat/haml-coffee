assert = require 'assert'
should = require 'should'
fs     = require 'fs'

CoffeeScript  = require 'coffee-script'
Compiler      = require '../lib/compiler'

suite = JSON.parse fs.readFileSync('test/specs/haml_spec.json')

for group, specs of suite
  for desc, spec of specs
    do (desc, spec) ->

      module.exports["#{ group }: #{ desc }"] = ->

        escaping = spec.config?.escape_html || false
        format   = spec.config?.format || 'xhtml'

        compiler = new Compiler({
          escape_html : escaping
          format      : format
        })

        console.log "\n\n\n"
        console.log "### TEST: #{ group }: #{ desc }\n"
        console.log "Compiler settings: { escape_html: #{ escaping }, format: #{ format } }\n"

        console.log "-------------------- Haml template ----------------------------"
        console.log spec.haml

        if spec.locals
          console.log "-------------------- Local variables --------------------------"
          console.log JSON.stringify(spec.locals)

        compiler.parse spec.haml
        cst = compiler.render 'test'

        console.log "-------------------- Rendered CST template --------------------"
        console.log cst


        template = CoffeeScript.compile cst

        window = {}
        eval template

        html = window.HAML.test(spec.locals)

        console.log "-------------------- Rendered HTML ---------------------------"
        console.log html

        html.should.eql(spec.html)

        return
