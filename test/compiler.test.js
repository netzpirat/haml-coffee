(function() {
  var CoffeeMaker, assert, fs, should;
  assert = require('assert');
  should = require('should');
  fs = require('fs');
  CoffeeMaker = require('../lib/coffee_maker');
  module.exports = {
    'Test compiler with hello.html.haml': function() {
      var compiled_output, html, source, window;
      compiled_output = CoffeeMaker.compileFile("test/valid/hello.html.haml");
      window = {};
      eval(compiled_output);
      html = window.HAML.test.valid.hello();
      source = fs.readFileSync("test/valid/hello.html").toString();
      html.should.eql(source);
    },
    'Test compiler with namespace/simple.html.haml': function() {
      var compiled_output, html, source, window;
      compiled_output = CoffeeMaker.compileFile("test/valid/namespace/simple.html.haml");
      window = {};
      eval(compiled_output);
      html = window.HAML.test.valid.namespace.simple({
        project_title: "Hello World"
      });
      source = fs.readFileSync("test/valid/namespace/simple.html").toString();
      html.should.eql(source);
    },
    'Test compiler with file with spaces.html.haml': function() {
      var compiled_output, html, source, window;
      compiled_output = CoffeeMaker.compileFile("test/valid/file with spaces.haml");
      window = {};
      eval(compiled_output);
      html = window.HAML.test.valid.file_with_spaces();
      source = fs.readFileSync("test/valid/file with spaces.html").toString();
      html.should.eql(source);
    },
    'Test compiler with complex.html.haml': function() {
      var compiled_output, html, source, window;
      compiled_output = CoffeeMaker.compileFile("test/valid/complex.html.haml");
      window = {};
      eval(compiled_output);
      html = window.HAML.test.valid.complex({
        items: ["a", "b", "c"],
        project_title: "Hello World"
      });
      source = fs.readFileSync("test/valid/complex.html").toString();
      html.should.eql(source);
    },
    'Test compiler with long_plain_text.html.haml': function() {
      var compiled_output, html, source, window;
      compiled_output = CoffeeMaker.compileFile("test/valid/long_plain_text.html.haml");
      window = {};
      eval(compiled_output);
      html = window.HAML.test.valid.long_plain_text();
      source = fs.readFileSync("test/valid/long_plain_text.html").toString();
      html.should.eql(source);
    },
    'Test compiler with escaping.html.haml': function() {
      var compiled_output, html, source, window;
      compiled_output = CoffeeMaker.compileFile("test/valid/escaping.html.haml");
      window = {};
      eval(compiled_output);
      html = window.HAML.test.valid.escaping({
        title: 'html <em>escaping</em> test'
      });
      source = fs.readFileSync("test/valid/escaping_on.html").toString();
      html.should.eql(source);
    },
    'Test compiler with escaping.html.haml and escaping turned off': function() {
      var compiled_output, html, source, window;
      compiled_output = CoffeeMaker.compileFile("test/valid/escaping.html.haml", "", null, {
        escape_html: false
      });
      window = {};
      eval(compiled_output);
      html = window.HAML.test.valid.escaping({
        title: 'html <em>escaping</em> test'
      });
      source = fs.readFileSync("test/valid/escaping_off.html").toString();
      html.should.eql(source);
    },
    'Test compiler with escaping.html.haml and custom escaping function': function() {
      var compiled_output, html, source, window;
      compiled_output = CoffeeMaker.compileFile("test/valid/escaping.html.haml", "", null, {
        escape_html: true,
        custom_html_escape: 'window.my_html_escape'
      });
      window = {
        my_html_escape: function(text) {
          return text;
        }
      };
      eval(compiled_output);
      html = window.HAML.test.valid.escaping({
        title: 'html <em>escaping</em> test'
      });
      source = fs.readFileSync("test/valid/escaping_off.html").toString();
      html.should.eql(source);
    },
    'Test compiler with functions_generating_haml.html.haml': function() {
      var compiled_output, html, source, window;
      compiled_output = CoffeeMaker.compileFile("test/valid/functions_generating_haml.html.haml");
      window = {};
      eval(compiled_output);
      html = window.HAML.test.valid.functions_generating_haml();
      source = fs.readFileSync("test/valid/functions_generating_haml.html").toString();
      html.should.eql(source);
    },
    'Test compiler with functions_generating_haml_no_use.html.haml': function() {
      var compiled_output, html, source, window;
      compiled_output = CoffeeMaker.compileFile("test/valid/functions_generating_haml_no_use.html.haml");
      window = {};
      eval(compiled_output);
      html = window.HAML.test.valid.functions_generating_haml_no_use();
      return source = fs.readFileSync("test/valid/functions_generating_haml_no_use.html").toString();
    }
  };
}).call(this);
