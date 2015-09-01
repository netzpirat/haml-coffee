fs   = require 'fs'
path = require 'path'

CoffeeScript = require 'coffee-script'
HamlCoffee   = require '../src/haml-coffee'
HC           = require '../src/hamlc'

suites = [
  'haml'
  'haml_coffee'
]

beforeEach ->
  @addMatchers
    toBeCompiledTo: (expected) ->
      @message = -> @actual.report
      @actual.generated is expected

for suite in suites
  data = JSON.parse fs.readFileSync("spec/suites/#{ suite }_spec.json")

  for group, specs of data
    for desc, spec of specs
      do (group, desc, spec) ->
        describe group, ->
          it "handles #{ desc }", ->

            window = {}
            window.HAML = {}

            config = {
              escapeHtml       : if spec.config?.escape_html is 'true' then true else false
              escapeAttributes : if spec.config?.escape_attributes is 'true' then true else false
              extendScope      : if spec.config?.extend_scope is 'true' then true else false
              placement        : spec.config?.placement || 'global'
              format           : spec.config?.format || 'xhtml'
              pwd              : spec.config?.pwd || ''
            }

            if spec.haml_template
              hamlTemplatePath = "spec/suites/templates/#{ spec.haml_template }.haml"
              spec.haml = fs.readFileSync(hamlTemplatePath).toString()
              if config.pwd is ''
                config.pwd = path.resolve(path.dirname(hamlTemplatePath))

            compiler = new HamlCoffee(config)

            report = "Generated output doesn't match the expected result.\n\n"
            report += "-------------------- Compiler settings ------------------------\n"
            report += JSON.stringify(config)
            report += "\n-------------------- Haml template ----------------------------\n"
            report += spec.haml

            if spec.partials && config.placement is 'global'
              report +=  "\n-------------------- Partial templates --------------------------\n"

              for name, partial of spec.partials
                try
                  source = fs.readFileSync("spec/suites/templates/#{ partial }.haml").toString()
                  window.HAML[name] = HC.compile(source)
                  report += "window.HAML['#{ name }'] compiled from source '#{ partial }'\n"
                catch error
                  report += "Error compiling partial #{ name }: #{ error }"

            if spec.locals
              report +=  "\n-------------------- Local variables --------------------------\n"
              report +=  JSON.stringify(spec.locals)

            compiler.parse spec.haml
            cst = compiler.render 'test'

            report +=  "\n-------------------- Marked output nodes ----------------------\n"
            for line in compiler.lines
              report += JSON.stringify(line) + '\n'

            report +=  "-------------------- Rendered CST template --------------------\n"
            report +=  cst

            try
              template = CoffeeScript.compile cst

              if config.placement is 'standalone'
                html = eval(template)(spec.locals)
              else # global
                eval template
                html = window.HAML.test(spec.locals)

            catch error
              report +=  "\n-------------- Error compiling JST -------------------------\n"
              report += "#{ error }"

            report +=  "\n-------------------- Rendered HTML ---------------------------\n"
            report +=  html

            spec.html = fs.readFileSync("spec/suites/templates/#{ spec.html_template }.html").toString() if spec.html_template
            result = spec.html

            report +=  "\n-------------------- Expected result--------------------------\n"
            report +=  result
            report += "\n---------------------------------------------------------------\n"

            expect({
              generated : html
              report    : report.split('\n').join('\n   ')
            }).toBeCompiledTo(result)
