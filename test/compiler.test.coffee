assert = require 'assert'
should = require 'should'
fs     = require 'fs'

CoffeeMaker = require('../lib/coffee_maker')

module.exports =
  # testing hello.html.haml
  'Test compiler with hello.html.haml': ->
    compiled_output = CoffeeMaker.compileFile "test/valid/hello.html.haml"
    
    # fake the browser & run the script
    window = {}
    eval compiled_output
    
    html = window.HAML.test.valid.hello()
    source = fs.readFileSync("test/valid/hello.html").toString()
    
    html.should.eql source
    return
  
  # testing namespace/simple.html.haml
  'Test compiler with namespace/simple.html.haml': ->
    compiled_output = CoffeeMaker.compileFile "test/valid/namespace/simple.html.haml"

    # fake the browser & run the script
    window = {}
    eval compiled_output

    html = window.HAML.test.valid.namespace.simple
      project_title: "Hello World"
    
    source = fs.readFileSync("test/valid/namespace/simple.html").toString()

    html.should.eql source
    return

  # testing file with spaces.html.haml
  'Test compiler with file with spaces.html.haml': ->
    compiled_output = CoffeeMaker.compileFile "test/valid/file with spaces.haml"

    # fake the browser & run the script
    window = {}
    eval(compiled_output)

    html = window.HAML.test.valid.file_with_spaces()
    source = fs.readFileSync("test/valid/file with spaces.html").toString()

    html.should.eql source
    return
    
  # testing file with complex.html.haml
  'Test compiler with complex.html.haml': ->
    compiled_output = CoffeeMaker.compileFile "test/valid/complex.html.haml"

    # fake the browser & run the script
    window = {}
    eval compiled_output

    html = window.HAML.test.valid.complex
      items: ["a", "b", "c"]
      project_title: "Hello World"
    source = fs.readFileSync("test/valid/complex.html").toString()

    html.should.eql source
    return
    
  'Test compiler with long_plain_text.html.haml': ->
    compiled_output = CoffeeMaker.compileFile "test/valid/long_plain_text.html.haml"

    # fake the browser & run the script
    window = {}
    eval compiled_output
    
    html = window.HAML.test.valid.long_plain_text()
    source = fs.readFileSync("test/valid/long_plain_text.html").toString()
    
    html.should.eql source
    return
    
  'Test compiler with escaping.html.haml': ->
    compiled_output = CoffeeMaker.compileFile "test/valid/escaping.html.haml"

    # fake the browser & run the script
    window = {}
    eval compiled_output

    html = window.HAML.test.valid.escaping
      title: 'html <em>escaping</em> test'
    source = fs.readFileSync("test/valid/escaping_on.html").toString()

    html.should.eql source
    return
    
  'Test compiler with escaping.html.haml and escaping turned off': ->
    compiled_output = CoffeeMaker.compileFile "test/valid/escaping.html.haml", "", null,
      escape_html: false

    # fake the browser & run the script
    window = {}
    eval compiled_output

    html = window.HAML.test.valid.escaping
      title: 'html <em>escaping</em> test'
    source = fs.readFileSync("test/valid/escaping_off.html").toString()

    html.should.eql source
    return
    
  'Test compiler with escaping.html.haml and custom escaping function': ->
    compiled_output = CoffeeMaker.compileFile "test/valid/escaping.html.haml", "", null,
      escape_html: true
      custom_html_escape: 'window.my_html_escape'

    # fake the browser & run the script
    window =
      my_html_escape: (text) -> text
    eval compiled_output

    html = window.HAML.test.valid.escaping
      title: 'html <em>escaping</em> test'
    source = fs.readFileSync("test/valid/escaping_off.html").toString()

    html.should.eql source
    return
    