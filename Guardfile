guard :coffeescript, :input => 'src', :output => 'lib'

guard :process, :name => 'NPM', :command => 'npm install' do
  watch %r{package.json}
end

guard :process, :name => 'Expresso', :command => 'expresso' do
  watch %r{(lib|test).*}
end
