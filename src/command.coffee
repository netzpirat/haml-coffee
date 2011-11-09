CoffeeMaker   = require('./coffee_maker')
fs            = require('fs')
glob          = require('glob')

argv = require('optimist')
  .usage('Usage: $0')
  .options('i',
    alias     : 'input'
    demand    : true
    describe  : 'Either a file or a directory name to be compiled'
  )
  .options('o',
    alias     : 'output'
    describe  : 'Set the output filename if you don\'t want the default one derived from the template filename'
  )
  .options('n',
    alias     : 'name'
    describe  : 'Set a custom template name if you don\'t want the default one derived from the template filename'
  )
  .options('disable-html-escaping',
    boolean   : true
    describe  : 'Disable any HTML output escaping'
  )
  .options('e',
    alias: 'custom-html-escape',
    default   : ''
    describe  : 'Set the custom HTML escaping function name'
  )
  .options('f',
    alias     : 'format',
    default   : 'html5'
    describe  : 'Set HTML output format, either `xhtml`, `html4` or `html5`'
  )
  .argv

# Main function to run from console. This can either compile a single Haml Coffee template,
# compile a directory of Haml Coffee templates into several JavaScript templates or a directory
# of Haml Coffee templates into one JavaScript template.
#
exports.run = ->

  throw "Unknown template format '#{ arv.f }'" unless ['xhtml', 'html4', 'html5'].indexOf(arv.f) is -1

  inputFilename   = argv.i
  templateName    = argv.n

  compilerOptions =
    escapeHtml       : not argv['disable-html-escaping']
    customHtmlEscape : argv.e
    format           : arv.f

  fs.stat inputFilename, (err, stat) ->
    unless err

      # Compile a single Haml CoffeeScript template
      unless stat.isDirectory()
        console.log '  \033[90m[Haml Coffee] Compiling file\033[0m %s', inputFilename

        outputFilename  = argv.o || "#{ argv.i.match(/([^\.]+)(\.html)?\.haml[c]?$/)?[1] }.jst"
        fs.writeFileSync outputFilename, CoffeeMaker.compileFile inputFilename, compilerOptions, templateName

        process.exit 0

      # Compile a directory of Haml CoffeeScript files
      else
        if templateName
          console.log '  \033[91m[Haml Coffee] You can\'t compile all Haml templates in a directory and give a single template name!\033[0m'
          process.exit 1

        console.log '  \033[92m[Haml Coffee] Compiling directory\033[0m %s', inputFilename

        # Removing a trailing slash
        baseDir  = inputFilename.replace(/\/$/, "")
        cwd      = process.cwd()

        # When an output filename is given, all templates will be concatenated
        compound = ''

        process.chdir(baseDir)

        # Loop through all Haml files and compile them
        glob.glob '**/*.haml[c]', '', (err, files) ->
          unless err
            for filename in files
              console.log '    \033[90m[Haml Coffee] Compiling file\033[0m %s', filename

              # Combine all files into a single output
              if argv.o
                compound += CoffeeMaker.compileFile filename, compilerOptions

              # Compile and write each file on its own
              else
                outputFilename  = "#{ filename.match(/([^\.]+)(\.html)?\.haml[c]?$/)?[1] }.jst"
                fs.writeFileSync outputFilename,  CoffeeMaker.compileFile filename, compilerOptions

            process.chdir cwd
            process.exit 0

    else
      console.log '  \033[91m[Haml Coffee] Error compiling file\033[0m %s', process.argv[2]
      process.exit 1
