assert = require 'assert'
should = require 'should'

Text = require('../lib/nodes/text')
Haml = require('../lib/nodes/haml')
Code = require('../lib/nodes/code')

module.exports =
  'Test haml with attributes and assigning an expression "%fooooooo{ :foo => "headline", :bar=>"doo",:baz =>    "doo",:\'data-tags\'=>"test,123,foo", :test => \'"one, two"\' }= "123#{456}"': ->
    haml = new Haml("%fooooooo{ :foo => \"headline\", :bar=>\"doo\",:baz =>    \"doo\",:'data-tags'=>\"test,123,foo\", :test => '\"one, two\"' }= \"123\#{456}\"", 0, 0, false)

    haml.getOpener().should.eql('o.push "<fooooooo foo=\\"headline\\" bar=\\"doo\\" baz=\\"doo\\" data-tags=\\"test,123,foo\\" test=\'\\"one, two\\"\'>#{"123#{456}"}"')
    haml.getCloser().should.eql('o.push "</fooooooo>"')
    
    return

  'Test haml with attributes and assigning an expression "%h1= "123""': ->
    haml = new Haml("%h1= \"123\"", 0, 0, false)

    haml.getOpener().should.eql('o.push "<h1>#{"123"}"')
    haml.getCloser().should.eql('o.push "</h1>"')

    return
    
  'Test haml with attributes and assigning an expression "%h1= "123"" and html escaping': ->
    haml = new Haml("%h1= \"123\"", 0, 0, true)

    haml.getOpener().should.eql('o.push "<h1>#{e "123"}"')
    haml.getCloser().should.eql('o.push "</h1>"')

    return

  'Test haml with attributes and assigning an expression "%h1= @project.get(\'title\')"': ->
    haml = new Haml("%h1= @project.get('title')", 0, 0, false)
    
    haml.getOpener().should.eql('o.push "<h1>#{@project.get(\'title\')}"')
    haml.getCloser().should.eql('o.push "</h1>"')
    
    return

  'Test haml with attributes and assigning an expression "%h1= @project.get(\'title\')" and html escaping': ->
    haml = new Haml("%h1= @project.get('title')", 0, 0, true)
    
    haml.getOpener().should.eql('o.push "<h1>#{e @project.get(\'title\')}"')
    haml.getCloser().should.eql('o.push "</h1>"')
    
    return
    
  'Test haml with attributes and assigning an expression ""': ->
    haml = new Haml("%h1= \"\#{@project.get('title')} no strings attached\"", 0, 0, false)
    
    haml.getOpener().should.eql('o.push "<h1>#{"\#{@project.get(\'title\')} no strings attached"}"')
    haml.getCloser().should.eql('o.push "</h1>"')
    
    return
  
  'Test haml with attributes and assigning an expression "" and html escaping': ->
    haml = new Haml("%h1= \"\#{@project.get('title')} no strings attached\"", 0, 0, true)
    
    haml.getOpener().should.eql('o.push "<h1>#{e "\#{@project.get(\'title\')} no strings attached"}"')
    haml.getCloser().should.eql('o.push "</h1>"')
    
    return
  
  'Test code with html escaping': ->
    code = new Code('= "abc"', 0, 0, true)

    #code.getOpener().should.eql('o.push e "#{"abc"}"')
    code.getOpener().should.eql('val = "#{"abc"}"\no.push e val')
    code.getCloser().should.eql('')

    return
  
  'Test code without html escaping': ->
    code = new Code('= "abc"', 0, 0, false)

    #code.getOpener().should.eql('o.push "#{"abc"}"')
    code.getOpener().should.eql('val = "#{"abc"}"\no.push val')
    code.getCloser().should.eql('')

    return
    
  'Test code with unescaping': ->
    code = new Code('!= "abc"', 0, 0, true)

    #code.getOpener().should.eql('o.push "#{"abc"}"')
    code.getOpener().should.eql('val = "#{"abc"}"\no.push val')
    code.getCloser().should.eql('')

    return
  
