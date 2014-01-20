desc "Build the haml-coffee-source gem"
task :gem do
  sh "grunt dist"

  require "json"
  require "fileutils"
  require "rubygems"
  require "tmpdir"
  require "rubygems/package"

  gemspec = Gem::Specification.new do |s|
    s.name        = "haml-coffee-source"
    s.version     = JSON.parse(File.read("package.json"))["version"].gsub("-", ".")
    s.date        = Time.now.strftime("%Y-%m-%d")

    s.homepage    = "https://github.com/netzpirat/haml-coffee/"
    s.summary     = "Haml Coffee Compiler"
    s.description = "JavaScript source code for the Haml Coffee compiler"

    s.license     = "MIT"

    s.files = [
      "lib/haml_coffee/hamlcoffee.js",
      "lib/haml_coffee/source.rb"
    ]

    s.authors     = ["Michael Kessler"]
    s.email       = "michi@flinkfinger.com"
  end


  root = Dir.getwd

  Dir.mktmpdir do |tmpdir|
    Dir.chdir(tmpdir) do
      FileUtils.mkdir_p "lib/haml_coffee/"

      File.open "lib/haml_coffee/source.rb", "w" do |f|
        f.write <<-RB
module HamlCoffee
  module Source
    VERSION = #{gemspec.version.to_s.inspect}

      def self.bundled_path
        File.expand_path("../hamlcoffee.js", __FILE__)
      end
  end
end
        RB
      end

      FileUtils.copy File.join(root, "dist/compiler/hamlcoffee.min.js"), "lib/haml_coffee/hamlcoffee.js"

      if defined?(Gem::Builder) # Rubygems 1
        Gem::Builder.new(gemspec).build
      else # Rubygems 2
        Gem::Package.build gemspec
      end

      pkg = File.join(root, 'pkg')
      FileUtils.mkdirr(pkg) unless File.exists?(pkg)
      FileUtils.copy gemspec.file_name, pkg

    end
  end
  warn "Built #{gemspec.file_name}"
end
