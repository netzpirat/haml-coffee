# This file contains all the helper functions that are needed by Haml Coffee at render time.
# You may want to include this in your application and customize compiler options to use
# the centralized helpers.
#
class HamlCoffeeHelpers

  # Escape reserved HTML characters by replacing them with
  # their equivalent HTML entities.
  #
  # @see http://www.w3schools.com/tags/ref_entities.asp
  #
  # @param [String] text the text that may contain reserved characters
  # @return [String] the escaped text
  #
  htmlEscape: (text) ->
    "#{ text }"
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\'/g, '&apos;')
    .replace(/\"/g, '&quot;')

  # Preserve whitespace in the text by replacing all newlines with
  # their HTML entities `&#x000A;`.
  #
  # @param [String] text the text to preserve whitespace
  # @return [String] the preserved text
  #
  preserve: (text) ->
    text.replace /\\n/g, '&#x000A;'

  # Find whitespace sensitive tags and preserve their content.
  #
  # If you change the `preserve` compiler option you must also change the
  # RegExp to search for the preserved tags.
  #
  # @param [String] text the text that may contain whitespace sensitive tags
  # @return [String] the preserved text
  #
  findAndPreserve: (text) ->
    text.replace /<(textarea|pre)>([^]*?)<\/\1>/g, (str, tag, content) ->
      "<\#{ tag }>\#{ content.replace /\\n/g, '&#x000A;' }</\#{ tag }>"

  # Clean the value that is returned after evaluating some inline CoffeeScript.
  #
  # @param [String] value the value to clean
  # @return [String] the cleaned value
  #
  cleanValue: (value) ->
    if value is null or value is undefined then '' else value
