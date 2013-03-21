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
      projectRoot: '.',

  grunt.registerTask 'test', [
    'jasmine_node'
    'regarde'
  ]

  grunt.registerTask 'default', ['test']
