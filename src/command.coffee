CoffeeMaker = require('./coffee_maker')
fs          = require('fs')
findit      = require('findit')

argv = require('optimist')
  .usage('Usage: $0')
  .options('i',
    alias     : 'input'
    demand    : true
    describe  : 'Either a file or a directory name to be compiled'
  )
  .options('o',
    alias     : 'output'
    describe  : 'Set the output filename'
  )
  .options('n',
    alias     : 'namespace'
    describe  : 'Set a custom template namespace'
    default   : 'window.HAML'
  )
  .options('t',
    alias     : 'template'
    describe  : 'Set a custom template name'
  )
  .options('f',
    alias     : 'format',
    default   : 'html5'
    describe  : 'Set HTML output format, either `xhtml`, `html4` or `html5`'
  )
  .options('e',
    alias: 'custom-html-escape',
    default   : ''
    describe  : 'Set the custom HTML escaping function name'
  )
  .options('disable-html-attribute-escaping',
    boolean   : true
    describe  : 'Disable any HTML attribute escaping'
  )
  .options('disable-html-escaping',
    boolean   : true
    describe  : 'Disable any HTML escaping'
  )
  .argv

# Main function to run from console. This can either compile a single Haml Coffee template,
# compile a directory of Haml Coffee templates into several JavaScript templates or a directory
# of Haml Coffee templates into one JavaScript template.
#
exports.run = ->

  throw "Unknown template format '#{ argv.f }'" if ['xhtml', 'html4', 'html5'].indexOf(argv.f) is -1

  inputFilename   = argv.i
  templateName    = argv.t
  namespace       = argv.n

  compilerOptions =
    escapeHtml       : not argv['disable-html-escaping']
    escapeAttributes : not argv['disable-html-attribute-escaping']
    customHtmlEscape : argv.e
    format           : argv.f

  fs.stat inputFilename, (err, stat) ->
    unless err

      # Compile a single Haml CoffeeScript template
      unless stat.isDirectory()
        console.log '  \033[90m[Haml Coffee] Compiling file\033[0m %s', inputFilename

        outputFilename  = argv.o || "#{ argv.i.match(/([^\.]+)(\.html)?\.haml[c]?$/)?[1] }.jst"
        fs.writeFileSync outputFilename, CoffeeMaker.compileFile(inputFilename, compilerOptions, namespace, templateName)

        process.exit 0

      # Compile a directory of Haml CoffeeScript files
      else
        if templateName
          console.log '  \033[91m[Haml Coffee] You can\'t compile all Haml templates in a directory and give a single template name!\033[0m'
          process.exit 1

        console.log '  \033[92m[Haml Coffee] Compiling directory\033[0m %s', inputFilename

        # Removing a trailing slash
        baseDir  = inputFilename.replace(/\/$/, '')

        # When an output filename is given, all templates will be concatenated
        compound = ''

        # Loop through all Haml files and compile them
        for filename in findit.sync baseDir
          if filename.match /([^\.]+)(\.html)?\.haml[c]?$/
            console.log '    \033[90m[Haml Coffee] Compiling file\033[0m %s', filename

            # Combine all files into a single output
            if argv.o
              compound += CoffeeMaker.compileFile(filename, compilerOptions, namespace)

            # Compile and write each file on its own
            else
              outputFilename  = "#{ filename.match(/([^\.]+)(\.html)?\.haml[c]?$/)?[1] }.jst"
              fs.writeFileSync outputFilename,  CoffeeMaker.compileFile(filename, compilerOptions)

        # Write concatenated output
        if argv.o
          fs.writeFileSync argv.o, compound

        process.exit 0

    else
      console.log '  \033[91m[Haml Coffee] Error compiling file\033[0m %s: %s', argv.i, err
      process.exit 1
