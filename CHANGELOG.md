# Haml Coffee Changelog

## Master

* Fix setting a custom reference function.

## Version 1.9.0, January 8, 2013

* HTML and Ruby style attributes can be mixed.
* [#47](https://github.com/netzpirat/haml-coffee/issues/47): Add support for Haml object reference syntax.

## Version 1.8.2, November 29, 2012

* [haml_coffee_assets issue #78](https://github.com/netzpirat/haml_coffee_assets/issues/78): Fix nested parenthesis detection within attributes..

## Version 1.8.1, November 25, 2012

* [#45](https://github.com/netzpirat/haml-coffee/issues/45): Fix CLI usage help and give a hint when read from STDIN.

## Version 1.8.0, November 15, 2012

* [#44](https://github.com/netzpirat/haml-coffee/issues/44): Allow stream redirection from the CLI.

## Version 1.7.0, November 2, 2012

* [haml_coffee_assets issue #75](https://github.com/netzpirat/haml_coffee_assets/issues/75): Escape forward slash.
* [haml_coffee_assets issue #74](https://github.com/netzpirat/haml_coffee_assets/issues/74): Add AMD dependency management.

## Version 1.6.2, October 26, 2012

* [#42](https://github.com/netzpirat/haml-coffee/issues/42)  Ensure HTML5 `data` attribute format is correct.

## Version 1.6.1, October 23, 2012

* [#41](https://github.com/netzpirat/haml-coffee/issues/41) Fix browserify package configuration.

## Version 1.6.0, October 16, 2012

  * [#40](https://github.com/netzpirat/haml-coffee/pull/40) Added placement option to allow for AMD support. ([@mehcode](https://github.com/mehcode))

## Version 1.5.1, September 24, 2012

  * Simple check to see if the template has an id or class to cleanup

## Version 1.5.0, September 24, 2012

  * Remove empty `id` and `class` attributes from the generated HTML.

## Version 1.4.10, September 14, 2012

  * Fix template context for compiled functions without JST generation.

## Version 1.4.9, September 14, 2012

  * [Issue #38](https://github.com/netzpirat/haml-coffee/issues/38): Helpers should run in the template's context.
  * Trim whitespace in the helpers.

## Version 1.4.8, September 11, 2012

  * Add `index.js` that loads the CoffeeScript compiler and Haml Coffee on Node.js

## Version 1.4.7, September 3, 2012

  * [haml_coffee_assets issue #68](https://github.com/netzpirat/haml_coffee_assets/issues/68): Don't use trim() for IE <= 8 compatibility.

## Version 1.4.6, August 28, 2012

  * Fix Browserify environment detection.

## Version 1.4.5, August 28, 2012

  * Escape and clean every attribute interpolation.
  * Don't add the Boolean conversion without any cleaned value.

## Version 1.4.4, August 22, 2012

  * Fix CoffeeScript compiler loading.

## Version 1.4.3, August 22, 2012

  * Add [hamlc](https://github.com/netzpirat/haml-coffee/blob/master/src/hamlc.coffee) facade to the compiler dist.
  * Fix package distribution.

## Version 1.4.2, August 20, 2012

  * Convert to pure CoffeeScript project. The pure JS compiler is only distributed as bundled file.
  * Fix colored cli output.
  * [haml_coffee_assets issue #65](https://github.com/netzpirat/haml_coffee_assets/issues/65): CoffeScript interpolation does not work.

## Version 1.4.1, August 5, 2012

  * Fix bug where caching is always enabled.

## Version 1.4.0, August 5, 2012

  * Add support for Express 3

## Version 1.3.0, August 3, 2012

  * [haml_coffee_assets issue #58](https://github.com/netzpirat/haml_coffee_assets/issues/58): Single quotes in attribute values are converted to double quotes.
  * [Issue #33](https://github.com/netzpirat/haml-coffee/issues/33): Fix tag attributes that contains multiple attribute keys.
  * Fix comments with tag attributes that follows a tag with attributes (multiline bug).
  * Fix wrong quotes that appears in comments.

## Version 1.2.0, Juli 18, 2012

  * [haml_coffee_assets issue #56](https://github.com/netzpirat/haml_coffee_assets/issues/56): Weird behavior when using space before the : of an attribute.
  * [haml_coffee_assets issue #57](https://github.com/netzpirat/haml_coffee_assets/issues/57): Fix quotes in text content.
  * [Issue #30](https://github.com/netzpirat/haml-coffee/issues/30): &apos; doesn't work in IE8

## Version 1.1.3, Juli 4, 2012

  * [haml_coffee_assets issue #55](https://github.com/netzpirat/haml_coffee_assets/issues/55): Error parsing HTML attributes with code interpolation.

## Version 1.1.2, June 29, 2012

  * Fix line number in the error message.
  * Ignore block level within comments.
  * Update to the latest Haml spec.

## Version 1.1.1, June 19, 2012

  * [haml_coffee_assets issue #51](https://github.com/netzpirat/haml_coffee_assets/issues/51): Parsing fails with double quotes inside single-quoted attribute value.
  * [haml_coffee_assets issue #49](https://github.com/netzpirat/haml_coffee_assets/issues/49): Failing to quote object literal keys.

## Version 1.1.0, June 12, 2012

  * [haml_coffee_assets issue #48](https://github.com/netzpirat/haml_coffee_assets/issues/48): Adding class on condition.
  * [Issue #29](https://github.com/netzpirat/haml-coffee/issues/29): Wrong boolean attribute handling.

## Version 1.0.1, June 10, 2012

  * Fix passing the extend CLI flag to the compiler.

## Version 1.0.0, June 10, 2012

  * Add `extendScope` compiler option for using `with` in the JavaScript template for simple context access.

## Version 0.8.3, June 8, 2012

  * [haml_coffee_assets issue #47](https://github.com/netzpirat/haml_coffee_assets/issues/47): Attribute parsing fails with interpolation under some circumstances.

## Version 0.8.2, June 5, 2012

  * [Issue #28](https://github.com/netzpirat/haml-coffee/issues/28): Print errors to stderr.

## Version 0.8.1, Mai 22, 2012

  * [haml_coffee_assets issue #46](https://github.com/netzpirat/haml_coffee_assets/issues/46): Attribute parsing broken

## Version 8.0.0, Mai 21, 2012

  * Fix attribute lookahead with no multilines for elements that have only an id or class declared.
  * [haml_coffee_assets issue #44](https://github.com/netzpirat/haml_coffee_assets/issues/43): Multiline and attributes doesn't work
  * Allow Ruby 1.8 and 1.9 style attributes to be mixed on the same tag.
  * [haml_coffee_assets issue #43](https://github.com/netzpirat/haml_coffee_assets/issues/43): Doesn't support quoted symbols

## Version 0.7.1, Mai 14, 2012

  * [haml_coffee_assets issue #42](https://github.com/netzpirat/haml_coffee_assets/issues/42): Fix tag parsing with parenthesis is the text

## Version 0.7.0, Mai 9, 2012

  * [Issue #26](https://github.com/netzpirat/haml-coffee/issues/26): Improve attribute parsing.

## Version 0.6.3, April 30, 2012

  * [haml_coffee_assets issue #40](https://github.com/netzpirat/haml_coffee_assets/issues/40): Fix class interpolation

## Version 0.6.2

  * [Issue #23](https://github.com/netzpirat/haml-coffee/issues/23): Fix double quotes escaping in Coffee filter.

## Version 0.6.1

  * Fix inserting code within inserting function.

## Version 0.6.0

  * Allow inserting code blocks to post process child output.
  * More robust attribute detection.

## Version 0.5.6

  * Add boolean attribute logic at render time.

## Version 0.5.5

  * Fix wrong evaluation of the `--basename` option.

## Version 0.5.4

  * Add `--basename` option to omit the path in the JST name.
  * Better attribute look-ahead support.

## Version 0.5.3

  * Better attribute look-ahead support.

## Version 0.5.2

  * Fix leaking global variables when generating the Express view
  * Fix Ruby 1.9 style attributes with double quotes

## Version 0.5.1

  * Improve template compilation for Express

## Version 0.5.0

  * Express support
  * Optimizations for enhanced rendering speed and template size
  * Add `--disable-clean-value` option

## Version 0.4.0

  * Remove short version for seldom used haml-coffee options
  * Add preserve and findAndPreserve helper and customization options
  * Add `--preserve` option to define the whitespace preserved tag list
  * Add `--autoclose` option to define self-closing tags
  * Add `--uglify` option to generate non-indented HTML tags

## Version 0.3.1

  * Fix custom clean value function when escaping function is also custom provided.

## Version 0.3.0

  * Add full Haml compatibility (haml-spec passes)
  * Add code documentation and improved README
  * Add support for Ruby 1.9 syntax attributes
  * Add `:coffeescript` filter
  * Add new compiler options
    - Namespace
    - Disable attribute escaping
    - Custom clean value
    - HTML output format

## Version 0.2.4

  * Fixed a bug with relative directories, closes issue #1

## Version 0.2.3

  * Added inline assignment of coffeescript expression for haml tags

## Version 0.1.12

  * Attribute values can be coffeescript expressions

## Version 0.1.11

  * Fixed bug with attribute comma separation

## Version 0.1.8

  * Bugfix with long text
  * Refactor tests into valid and invalid cases
  * Add exit codes for binary
