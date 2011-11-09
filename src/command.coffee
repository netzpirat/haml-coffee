CoffeeMaker   = require('./coffee_maker')
fs            = require('fs')
glob          = require('glob')

argv = require('optimist')
  .usage("Usage: $0")
  .options('i',
    alias: 'input'
    demand: true
    describe: 'Either a file or a directory name, in a directory all *.haml files will be processed"
  )
  .options('o',
    alias: 'output'
    default: 'compiled-haml.js'
    describe: "Output filename"
  )
  .options('n',
    alias: 'name'
    describe: "Template name, if you don't want the default one, derived from a filename"
  )
  .options('disable-html-escaping',
    boolean: true
    describe: "Use this if you want to disable html escaping"
  )
  .options('e',
    alias: 'custom-html-escape',
    default: ''
    describe: "Use this to pass a name of your custom html escaping function"
  )
  .argv

# Main function to run from console
#
exports.run = ->

  inputFilename   = argv.i
  outputFilename  = argv.o
  templateName    = argv.n
  compiledOutput  = ''
  compilerOptions =
    escapeHtml       : not argv['disable-html-escaping']
    customHtmlEscape : argv.e

  fs.stat inputFilename, (err, stat) ->
    unless err

      # Compile a single Haml CoffeeScript template
      unless stat.isDirectory()
        console.log '  \033[90m[haml coffee] compiling file\033[0m %s', inputFilename

        compiledOutput = CoffeeMaker.compileFile inputFilename, compiledOutput, templateName, compilerOptions
        fs.writeFileSync outputFilename, compiledOutput

        process.exit 0

      # Compile a directory of Haml CoffeeScript files
      else
        console.log '  \033[92m[haml coffee] compiling directory\033[0m %s', inputFilename

        # removing a trailing slash
        baseDir = inputFilename.replace(/\/$/, "")
        cwd     = process.cwd()

        process.chdir(baseDir)

        # Loop through all Haml files and compile them
        glob.glob "**/*.haml", "", (err, matches) ->
          unless err
            for match in matches
              console.log '    \033[90m[haml coffee] compiling file\033[0m %s', match

              filename = "#{ match }"
              compiledOutput = CoffeeMaker.compileFile filename, compiledOutput, null, compilerOptions

            process.chdir cwd
            fs.writeFileSync outputFilename, compiledOutput

            process.exit 0

    else
      console.log '  \033[91m[haml coffee] error compiling file\033[0m %s', process.argv[2]
      process.exit 1
