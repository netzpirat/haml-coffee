(function() {
  var Code, Haml, Text, assert, should;
  assert = require('assert');
  should = require('should');
  Text = require('../lib/nodes/text');
  Haml = require('../lib/nodes/haml');
  Code = require('../lib/nodes/code');
  module.exports = {
    'Test div with id #foo': function() {
      var haml;
      haml = new Haml("#foo", 0, 0, false);
      haml.getOpener().should.eql('o.push "<div id=\\"foo\\">"');
      return haml.getCloser().should.eql('o.push "</div>"');
    },
    'Test div with id .clazz': function() {
      var haml;
      haml = new Haml(".clazz", 0, 0, false);
      haml.getOpener().should.eql('o.push "<div class=\\"clazz\\">"');
      return haml.getCloser().should.eql('o.push "</div>"');
    },
    'Test div with id #foo.multiple.clazz': function() {
      var haml;
      haml = new Haml("#foo.multiple.clazz", 0, 0, false);
      haml.getOpener().should.eql('o.push "<div id=\\"foo\\" class=\\"multiple clazz\\">"');
      return haml.getCloser().should.eql('o.push "</div>"');
    },
    'Test div with id #foo.multiple.clazz{ :foo => "headline", :bar=>"doo",:baz =>    "doo",:\'data-method\'=>"DELETE" }': function() {
      var haml;
      haml = new Haml("#foo.multiple.clazz{ :foo => \"headline\", :bar=>\"doo\",:baz =>    \"doo\",:'data-method'=>\"DELETE\" }", 0, 0, false);
      haml.getOpener().should.eql('o.push "<div id=\\"foo\\" class=\\"multiple clazz\\" foo=\\"headline\\" bar=\\"doo\\" baz=\\"doo\\" data-method=\\"DELETE\\">"');
      return haml.getCloser().should.eql('o.push "</div>"');
    },
    'Test haml "%h1"': function() {
      var haml;
      haml = new Haml("%h1", 0, 0, false);
      haml.getOpener().should.eql('o.push "<h1>"');
      return haml.getCloser().should.eql('o.push "</h1>"');
    },
    'Test haml with attributes "%h1{ :foo => "headline", :bar=>"doo",:baz =>    "doo",:\'data-tags\'=>"test,123,foo", :test => \'"one, two"\' }"': function() {
      var haml;
      haml = new Haml("%h1{ :foo => \"headline\", :bar=>\"doo\",:baz =>    \"doo\",:'data-tags'=>\"test,123,foo\", :test => '\"one, two\"' }", 0, 0, false);
      haml.getOpener().should.eql('o.push "<h1 foo=\\"headline\\" bar=\\"doo\\" baz=\\"doo\\" data-tags=\\"test,123,foo\\" test=\'\\"one, two\\"\'>"');
      return haml.getCloser().should.eql('o.push "</h1>"');
    },
    'Test haml with expression as value attribute': function() {
      var haml;
      haml = new Haml("%h1{ :foo => myexpresssion }", 0, 0, false);
      haml.getOpener().should.eql('o.push "<h1 foo=\\"#{myexpresssion}\\">"');
      return haml.getCloser().should.eql('o.push "</h1>"');
    },
    'Test haml self close tags "meta", "img", "link", "br", "hr", "input", "area", "base"': function() {
      var haml, self_close_tags, tag, _i, _len, _results;
      self_close_tags = ["meta", "img", "link", "br", "hr", "input", "area", "base"];
      _results = [];
      for (_i = 0, _len = self_close_tags.length; _i < _len; _i++) {
        tag = self_close_tags[_i];
        haml = new Haml("%" + tag, 0, 0, false);
        haml.getOpener().should.eql("o.push \"<" + tag + " />\"");
        _results.push(haml.getCloser().should.eql(""));
      }
      return _results;
    },
    'Test haml self close img tags with attributes "%img{ :foo => "headline", :bar=>"doo",:baz =>    "doo",:\'data-method\'=>"DELETE" }"': function() {
      var haml;
      haml = new Haml("%img{ :foo => \"headline\", :bar=>\"doo\",:baz =>    \"doo\",:'data-method'=>\"DELETE\" }", 0, 0, false);
      haml.getOpener().should.eql('o.push "<img foo=\\"headline\\" bar=\\"doo\\" baz=\\"doo\\" data-method=\\"DELETE\\" />"');
      return haml.getCloser().should.eql('');
    },
    'Test Text "foo bar baz"': function() {
      var text;
      text = new Text("foo bar baz", 0, 0);
      text.getOpener().should.eql('o.push "foo bar baz"');
      return text.getCloser().should.eql('');
    },
    'Test Code "- if 1=1"': function() {
      var code;
      code = new Code("- if 1=1", 0, 0, false);
      code.getOpener().should.eql("if 1=1");
      return code.getCloser().should.eql("");
    }
  };
}).call(this);
