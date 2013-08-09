desc "Build the haml-coffee-source gem"
task :gem do
  sh "grunt dist"

  require "json"
  require "rubygems"
  require "rubygems/package"

  gemspec = Gem::Specification.new do |s|
    s.name        = "haml-coffee-source"
    s.version     = JSON.parse(File.read("package.json"))["version"].gsub("-", ".")
    s.date        = Time.now.strftime("%Y-%m-%d")

    s.homepage    = "https://github.com/netzpirat/haml-coffee/"
    s.summary     = "Haml Coffee Compiler"
    s.description = "JavaScript source code for the Haml Coffee compiler"
    s.files = [
      "lib/haml_coffee/hamlcoffee.js",
      "lib/haml_coffee/source.rb"
    ]

    s.authors     = ["Michael Kessler"]
    s.email       = "michi@netzpiraten.ch"
  end

  file = File.open("haml-coffee-source-#{gemspec.version}.gem", "w")
  Gem::Package.open(file, "w") do |pkg|
    pkg.metadata = gemspec.to_yaml

    path = "lib/haml_coffee/source.rb"
    contents = <<-RUBY
module HamlCoffee
  module Source
    VERSION = #{gemspec.version.to_s.inspect}

    def self.bundled_path
      File.expand_path("../hamlcoffee.js", __FILE__)
    end
  end
end
    RUBY
    pkg.add_file_simple(path, 0644, contents.size) do |tar_io|
      tar_io.write(contents)
    end

    File.open("dist/compiler/hamlcoffee.min.js", "r") do |input|
      pkg.add_file_simple("lib/haml_coffee/hamlcoffee.js", 0644, input.size) do |tar_io|
        tar_io.write input.read
      end
    end
  end

  warn "Built #{file.path}"
end
