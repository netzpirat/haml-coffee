CoffeeMaker = require './coffee-maker'
fs          = require 'fs'
findit      = require 'findit'

red   = '\u001b[31m'
green = '\u001b[32m'
reset = '\u001b[0m'

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
  .options('b',
    alias     : 'basename',
    boolean   : true
    default   : false
    describe  : 'Ignore file path when generate the template name'
  )
  .options('f',
    alias     : 'format',
    default   : 'html5'
    describe  : 'Set HTML output format, either `xhtml`, `html4` or `html5`'
  )
  .options('u',
    alias     : 'uglify',
    boolean   : true
    default   : false
    describe  : 'Do not properly indent or format the HTML output'
  )
  .options('e',
    alias     : 'extend',
    boolean   : true
    default   : false
    describe  : 'Extend the template scope with the context'
  )
  .options('p',
    alias     : 'placement',
    default   : 'global'
    describe  : 'Where to place the template function; one of: global, amd'
   )
  .options('preserve',
    default   : 'pre,textarea'
    describe  : 'Set a comma separated list of HTML tags to preserve'
  )
  .options('autoclose',
    default   : 'meta,img,link,br,hr,input,area,param,col,base'
    describe  : 'Set a comma separated list of self-closed HTML tags'
  )
  .options('disable-html-attribute-escaping',
    boolean   : true
    describe  : 'Disable any HTML attribute escaping'
  )
  .options('disable-html-escaping',
    boolean   : true
    describe  : 'Disable any HTML escaping'
  )
  .options('disable-clean-value',
    boolean   : true
    describe  : 'Disable any CoffeeScript code value cleaning'
  )
  .options('custom-html-escape',
    default   : ''
    describe  : 'Set the custom HTML escaping function name'
  )
  .options('custom-preserve',
    default   : ''
    describe  : 'Set the custom preserve whitespace function name'
  )
  .options('custom-find-and-preserve',
    default   : ''
    describe  : 'Set the custom find and preserve whitespace function name'
  )
  .options('custom-clean-value',
    default   : ''
    describe  : 'Set the custom code value clean function name'
  )
  .options('custom-surround',
    default   : ''
    describe  : 'Set the custom surround function name'
  )
  .options('custom-succeed',
    default   : ''
    describe  : 'Set the custom succeed function name'
  )
  .options('custom-precede',
    default   : ''
    describe  : 'Set the custom precede function name'
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
    placement             : argv.p
    format                : argv.f
    uglify                : argv.u
    extendScope           : argv.e
    preserveTags          : argv.preserve
    escapeHtml            : not argv['disable-html-escaping']
    escapeAttributes      : not argv['disable-html-attribute-escaping']
    cleanValue            : not argv['disable-clean-value']
    customHtmlEscape      : argv['custom-html-escape']
    customCleanValue      : argv['custom-clean-value']
    customFindAndPreserve : argv['custom-find-and-preserve']
    customPreserve        : argv['custom-preserve']
    customSurround        : argv['custom-surround']
    customSucceed         : argv['custom-succeed']
    customPrecede         : argv['custom-precede']
    basename              : argv['basename']

  fs.stat inputFilename, (err, stat) ->
    unless err

      # Compile a single Haml CoffeeScript template
      unless stat.isDirectory()
        outputFilename  = argv.o || "#{ argv.i.match(/([^\.]+)(\.html)?\.haml[c]?$/)?[1] }.jst"
        console.error "  #{ green }[Haml Coffee] Compiling file#{ reset } %s to %s", inputFilename, outputFilename
        fs.writeFileSync outputFilename, CoffeeMaker.compileFile(inputFilename, compilerOptions, namespace, templateName)

        process.exit 0

      # Compile a directory of Haml CoffeeScript files
      else
        if templateName
          console.error "  #{ red }[Haml Coffee] You can\'t compile all Haml templates in a directory and give a single template name!#{ reset }"
          process.exit 1

        console.log "  #{ green }[Haml Coffee] Compiling directory#{ reset } %s", inputFilename

        # Removing a trailing slash
        baseDir  = inputFilename.replace(/\/$/, '')

        # When an output filename is given, all templates will be concatenated
        compound = ''

        # Loop through all Haml files and compile them
        for filename in findit.sync baseDir
          if filename.match /([^\.]+)(\.html)?\.haml[c]?$/

            # Combine all files into a single output
            if argv.o
              console.log "    #{ green }[Haml Coffee] Compiling file#{ reset } %s", filename
              compound += CoffeeMaker.compileFile(filename, compilerOptions, namespace)

            # Compile and write each file on its own
            else
              outputFilename  = "#{ filename.match(/([^\.]+)(\.html)?\.haml[c]?$/)?[1] }.jst"
              console.log "  #{ green }[Haml Coffee] Compiling file#{ reset } %s to %s", inputFilename, outputFilename
              fs.writeFileSync outputFilename,  CoffeeMaker.compileFile(filename, compilerOptions)

        # Write concatenated output
        if argv.o
          console.log "    #{ green }[Haml Coffee] Writing all templates to#{ reset } %s", argv.o
          fs.writeFileSync argv.o, compound

        process.exit 0

    else
      console.error "  #{ red }[Haml Coffee] Error compiling file#{ reset } %s: %s", argv.i, err
      process.exit 1
