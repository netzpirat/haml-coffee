guard :coffeescript, input: 'dist/helpers', output: 'dist/helpers'

guard 'process', name: 'Jasmine specs', command: 'jasmine-node --coffee --color spec/compiler_spec.coffee' do
  watch(%r{src|spec})
end
