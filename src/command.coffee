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

exports.run = ->
  input_filename = argv.i
  output_filename = argv.o
  template_name = argv.n
  compiled_output = ""
  compiler_options =
    escape_html: not argv['disable-html-escaping']
    custom_html_escape: argv.e
    
  fs.stat input_filename, (err, stat) ->
    unless err
      unless stat.isDirectory()
        console.log '  \033[90m[haml coffee] compiling file\033[0m %s', input_filename
        compiled_output = CoffeeMaker.compileFile input_filename, compiled_output,
          template_name, compiler_options
        
        fs.writeFileSync output_filename, compiled_output
        
        process.exit 0
      else
        console.log '  \033[92m[haml coffee] compiling directory\033[0m %s', input_filename
        # removing a trailing slash
        cwd = process.cwd()
        base_dir = input_filename.replace(/\/$/, "")
        process.chdir(base_dir)
        glob.glob "**/*.haml", "", (err, matches) ->
          unless err
            for match in matches
              console.log '    \033[90m[haml coffee] compiling file\033[0m %s', match
              filename = "#{match}"
              compiled_output = CoffeeMaker.compileFile filename, compiled_output,
                null, compiler_options

            process.chdir cwd
            fs.writeFileSync output_filename, compiled_output

            process.exit 0
          return
    else
      console.log '  \033[91m[haml coffee] error compiling file\033[0m %s', process.argv[2]
      process.exit 1
    return
  return