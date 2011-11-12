(function() {
  var Code, Haml, Text, assert, should;
  assert = require('assert');
  should = require('should');
  Text = require('../lib/nodes/text');
  Haml = require('../lib/nodes/haml');
  Code = require('../lib/nodes/code');
  module.exports = {
    'Test haml with attributes and assigning an expression "%fooooooo{ :foo => "headline", :bar=>"doo",:baz =>    "doo",:\'data-tags\'=>"test,123,foo", :test => \'"one, two"\' }= "123#{456}"': function() {
      var haml;
      haml = new Haml("%fooooooo{ :foo => \"headline\", :bar=>\"doo\",:baz =>    \"doo\",:'data-tags'=>\"test,123,foo\", :test => '\"one, two\"' }= \"123\#{456}\"", 0, 0, false);
      haml.getOpener().should.eql('o.push "<fooooooo foo=\\"headline\\" bar=\\"doo\\" baz=\\"doo\\" data-tags=\\"test,123,foo\\" test=\'\\"one, two\\"\'>#{"123#{456}"}"');
      haml.getCloser().should.eql('o.push "</fooooooo>"');
    },
    'Test haml with attributes and assigning an expression "%h1= "123""': function() {
      var haml;
      haml = new Haml("%h1= \"123\"", 0, 0, false);
      haml.getOpener().should.eql('o.push "<h1>#{"123"}"');
      haml.getCloser().should.eql('o.push "</h1>"');
    },
    'Test haml with attributes and assigning an expression "%h1= "123"" and html escaping': function() {
      var haml;
      haml = new Haml("%h1= \"123\"", 0, 0, true);
      haml.getOpener().should.eql('o.push "<h1>#{e "123"}"');
      haml.getCloser().should.eql('o.push "</h1>"');
    },
    'Test haml with attributes and assigning an expression "%h1= @project.get(\'title\')"': function() {
      var haml;
      haml = new Haml("%h1= @project.get('title')", 0, 0, false);
      haml.getOpener().should.eql('o.push "<h1>#{@project.get(\'title\')}"');
      haml.getCloser().should.eql('o.push "</h1>"');
    },
    'Test haml with attributes and assigning an expression "%h1= @project.get(\'title\')" and html escaping': function() {
      var haml;
      haml = new Haml("%h1= @project.get('title')", 0, 0, true);
      haml.getOpener().should.eql('o.push "<h1>#{e @project.get(\'title\')}"');
      haml.getCloser().should.eql('o.push "</h1>"');
    },
    'Test haml with attributes and assigning an expression ""': function() {
      var haml;
      haml = new Haml("%h1= \"\#{@project.get('title')} no strings attached\"", 0, 0, false);
      haml.getOpener().should.eql('o.push "<h1>#{"\#{@project.get(\'title\')} no strings attached"}"');
      haml.getCloser().should.eql('o.push "</h1>"');
    },
    'Test haml with attributes and assigning an expression "" and html escaping': function() {
      var haml;
      haml = new Haml("%h1= \"\#{@project.get('title')} no strings attached\"", 0, 0, true);
      haml.getOpener().should.eql('o.push "<h1>#{e "\#{@project.get(\'title\')} no strings attached"}"');
      haml.getCloser().should.eql('o.push "</h1>"');
    },
    'Test code with html escaping': function() {
      var code;
      code = new Code('= "abc"', 0, 0, true);
      code.getOpener().should.eql('val = "#{"abc"}"\no.push e val');
      code.getCloser().should.eql('');
    },
    'Test code without html escaping': function() {
      var code;
      code = new Code('= "abc"', 0, 0, false);
      code.getOpener().should.eql('val = "#{"abc"}"\no.push val');
      code.getCloser().should.eql('');
    },
    'Test code with unescaping': function() {
      var code;
      code = new Code('!= "abc"', 0, 0, true);
      code.getOpener().should.eql('val = "#{"abc"}"\no.push val');
      code.getCloser().should.eql('');
    }
  };
}).call(this);
