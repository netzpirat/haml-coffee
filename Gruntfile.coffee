path = require 'path'

module.exports = (grunt) ->
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks)

  grunt.initConfig
    regarde:
      jasmine_node:
        files: [
          'src/**/*.coffee',
          'spec/*.coffee'
          'spec/**/*.json'
          'spec/**/*.haml'
          'spec/**/*.html'
        ],
        tasks:  ['jasmine_node'],
        spawn: true
    jasmine_node:
      specNameMatcher: '_spec'
      extensions: 'coffee'
      projectRoot: '.'
    uglify:
      dist:
        files:
          'dist/compiler/hamlcoffee.min.js': ['dist/compiler/hamlcoffee.js']

  # Use a custom task for using the latest v1 version of Browserify,
  # since I don't like the current contraints in v2 like the need to
  # have the `.coffee` extension within the require and that all paths
  # are absolute.
  #
  grunt.registerTask 'browserify', 'Create the browser distribution', ->
    browserify = require('browserify')()
    browserify.ignore 'coffee-script'
    browserify.require "#{ __dirname }/src/haml-coffee.coffee"
    browserify.require "#{ __dirname }/src/hamlc.coffee"
    grunt.file.write 'dist/compiler/hamlcoffee.js', browserify.bundle()

  grunt.registerTask 'watch', [
    'regarde'
  ]

  grunt.registerTask 'test', [
    'jasmine_node'
  ]

  grunt.registerTask 'release', [
    'jasmine_node'
    'browserify'
    'uglify:dist'
  ]

  grunt.registerTask 'default', ['watch']
