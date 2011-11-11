assert = require 'assert'
should = require 'should'
fs     = require 'fs'

CoffeeScript  = require 'coffee-script'
Compiler      = require '../lib/compiler'

suites = [
  'haml'
  'haml_coffee'
]

beforeEach ->
  @addMatchers
    toBeCompiledTo: (expect) ->
      @message = -> @actual.report
      @actual.generated is expect

for suite in suites
  data = JSON.parse fs.readFileSync("spec/suites/#{ suite }_spec.json")

  for group, specs of data
    for desc, spec of specs
      do (group, desc, spec) ->
        describe group, ->
          it "handles #{ desc }", ->

            escaping = spec.config?.escape_html || false
            format   = spec.config?.format || 'xhtml'

            compiler = new Compiler({
              escapeHtml : escaping
              format     : format
            })

            report = "Generated output doesn't match the expected result.\n\n"
            report += "---------------------------------------------------------------\n"
            report += "Compiler settings: { escape_html: #{ escaping }, format: #{ format } }\n"
            report += "-------------------- Haml template ----------------------------\n"
            report += spec.haml

            if spec.locals
              report +=  "\n-------------------- Local variables --------------------------\n"
              report +=  JSON.stringify(spec.locals)

            haml = spec.haml || fs.readFileSync(spec.haml_template)

            compiler.parse haml
            cst = compiler.render 'test'

            report +=  "\n-------------------- Marked output nodes ----------------------\n"
            for line in compiler.lines
              report += JSON.stringify(line) + '\n'

            report +=  "-------------------- Rendered CST template --------------------\n"
            report +=  cst

            try
              template = CoffeeScript.compile cst

              window = {}
              eval template

              html = window.HAML.test(spec.locals)

            catch error

            report +=  "\n-------------------- Rendered HTML ---------------------------\n"
            report +=  html

            spec.html = fs.readFileSync(spec.html_template) if spec.html_template
            result = spec.html

            report +=  "\n-------------------- Expected result--------------------------\n"
            report +=  result
            report += "\n---------------------------------------------------------------\n"

            expect({
              generated : html
              report    : report.split('\n').join('\n   ')
            }).toBeCompiledTo(result)
