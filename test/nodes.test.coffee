assert = require 'assert'
should = require 'should'

Text = require('../lib/nodes/text')
Haml = require('../lib/nodes/haml')
Code = require('../lib/nodes/code')

module.exports =
  'Test div with id #foo': ->
    haml = new Haml("#foo", 0, 0, false)
  
    haml.getOpener().should.eql('o.push "<div id=\\"foo\\">"')
    haml.getCloser().should.eql('o.push "</div>"')
  
  'Test div with id .clazz': ->
    haml = new Haml(".clazz", 0, 0, false)
  
    haml.getOpener().should.eql('o.push "<div class=\\"clazz\\">"')
    haml.getCloser().should.eql('o.push "</div>"')
  
  'Test div with id #foo.multiple.clazz': ->
    haml = new Haml("#foo.multiple.clazz", 0, 0, false)
  
    haml.getOpener().should.eql('o.push "<div id=\\"foo\\" class=\\"multiple clazz\\">"')
    haml.getCloser().should.eql('o.push "</div>"')
  
  'Test div with id #foo.multiple.clazz{ :foo => "headline", :bar=>"doo",:baz =>    "doo",:\'data-method\'=>"DELETE" }': ->
    haml = new Haml("#foo.multiple.clazz{ :foo => \"headline\", :bar=>\"doo\",:baz =>    \"doo\",:'data-method'=>\"DELETE\" }", 0, 0, false)
    
    haml.getOpener().should.eql('o.push "<div id=\\"foo\\" class=\\"multiple clazz\\" foo=\\"headline\\" bar=\\"doo\\" baz=\\"doo\\" data-method=\\"DELETE\\">"')
    haml.getCloser().should.eql('o.push "</div>"')
  
  'Test haml "%h1"': ->
    haml = new Haml("%h1", 0, 0, false)
  
    haml.getOpener().should.eql('o.push "<h1>"')
    haml.getCloser().should.eql('o.push "</h1>"')
  
  'Test haml with attributes "%h1{ :foo => "headline", :bar=>"doo",:baz =>    "doo",:\'data-tags\'=>"test,123,foo", :test => \'"one, two"\' }"': ->
    haml = new Haml("%h1{ :foo => \"headline\", :bar=>\"doo\",:baz =>    \"doo\",:'data-tags'=>\"test,123,foo\", :test => '\"one, two\"' }", 0, 0, false)
  
    haml.getOpener().should.eql('o.push "<h1 foo=\\"headline\\" bar=\\"doo\\" baz=\\"doo\\" data-tags=\\"test,123,foo\\" test=\'\\"one, two\\"\'>"')
    haml.getCloser().should.eql('o.push "</h1>"')

  'Test haml with expression as value attribute': ->
    haml = new Haml("%h1{ :foo => myexpresssion }", 0, 0, false)
  
    haml.getOpener().should.eql('o.push "<h1 foo=\\"#{myexpresssion}\\">"')
    haml.getCloser().should.eql('o.push "</h1>"')
  
  'Test haml self close tags "meta", "img", "link", "br", "hr", "input", "area", "base"': ->
    self_close_tags = ["meta", "img", "link", "br", "hr", "input", "area", "base"]
    for tag in self_close_tags
      haml = new Haml("%#{tag}", 0, 0, false)
    
      haml.getOpener().should.eql("o.push \"<#{tag} />\"")
      haml.getCloser().should.eql("")
  
  'Test haml self close img tags with attributes "%img{ :foo => "headline", :bar=>"doo",:baz =>    "doo",:\'data-method\'=>"DELETE" }"': ->
    haml = new Haml("%img{ :foo => \"headline\", :bar=>\"doo\",:baz =>    \"doo\",:'data-method'=>\"DELETE\" }", 0, 0, false)
    
    haml.getOpener().should.eql('o.push "<img foo=\\"headline\\" bar=\\"doo\\" baz=\\"doo\\" data-method=\\"DELETE\\" />"')
    haml.getCloser().should.eql('')
  
  # testing plain text
  'Test Text "foo bar baz"': ->
    text = new Text("foo bar baz", 0, 0)
    
    text.getOpener().should.eql('o.push "foo bar baz"')
    text.getCloser().should.eql('')
  
  # testing coffeescript
  'Test Code "- if 1=1"': ->
    code = new Code("- if 1=1", 0, 0, false)
  
    code.getOpener().should.eql("if 1=1")
    code.getCloser().should.eql("")
