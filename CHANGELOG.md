# Master

* [haml_coffee_assets issue #47](https://github.com/netzpirat/haml_coffee_assets/issues/47): Attribute parsing fails with interpolation under some circumstances.

# Version 0.8.2, June 5, 2012

* [Issue #28](https://github.com/9elements/haml-coffee/issues/28): Print errors to stderr.

# Version 0.8.1, Mai 22, 2012

* [haml_coffee_assets issue #46](https://github.com/netzpirat/haml_coffee_assets/issues/46): Attribute parsing broken

# Version 8.0.0, Mai 21, 2012

  * Fix attribute lookahead with no multilines for elements that have only an id or class declared.
  * [haml_coffee_assets issue #44](https://github.com/netzpirat/haml_coffee_assets/issues/43): Multiline and attributes doesn't work
  * Allow Ruby 1.8 and 1.9 style attributes to be mixed on the same tag.
  * [haml_coffee_assets issue #43](https://github.com/netzpirat/haml_coffee_assets/issues/43): Doesn't support quoted symbols

# Version 0.7.1, Mai 14, 2012

  * [haml_coffee_assets issue #42](https://github.com/netzpirat/haml_coffee_assets/issues/42): Fix tag parsing with parenthesis is the text

# Version 0.7.0, Mai 9, 2012

  * [Issue #26](https://github.com/9elements/haml-coffee/issues/26): Improve attribute parsing.

# Version 0.6.3, April 30, 2012

  * [haml_coffee_assets issue #40](https://github.com/netzpirat/haml_coffee_assets/issues/40): Fix class interpolation

# Version 0.6.2

  * [Issue #23](https://github.com/9elements/haml-coffee/issues/23): Fix double quotes escaping in Coffee filter.

# Version 0.6.1

  * Fix inserting code within inserting function.

# Version 0.6.0

  * Allow inserting code blocks to post process child output.
  * More robust attribute detection.

# Version 0.5.6

  * Add boolean attribute logic at render time.

# Version 0.5.5

  * Fix wrong evaluation of the `--basename` option.

# Version 0.5.4

  * Add `--basename` option to omit the path in the JST name.
  * Better attribute look-ahead support.

# Version 0.5.3

  * Better attribute look-ahead support.

# Version 0.5.2

  * Fix leaking global variables when generating the Express view
  * Fix Ruby 1.9 style attributes with double quotes

# Version 0.5.1

  * Improve template compilation for Express

# Version 0.5.0

  * Express support
  * Optimizations for enhanced rendering speed and template size
  * Add `--disable-clean-value` option

# Version 0.4.0

  * Remove short version for seldom used haml-coffee options
  * Add preserve and findAndPreserve helper and customization options
  * Add `--preserve` option to define the whitespace preserved tag list
  * Add `--autoclose` option to define self-closing tags
  * Add `--uglify` option to generate non-indented HTML tags

# Version 0.3.1

  * Fix custom clean value function when escaping function is also custom provided.

# Version 0.3.0

  * Add full Haml compatibility (haml-spec passes)
  * Add code documentation and improved README
  * Add support for Ruby 1.9 syntax attributes
  * Add `:coffeescript` filter
  * Add new compiler options
    - Namespace
    - Disable attribute escaping
    - Custom clean value
    - HTML output format

# Version 0.2.4

  * Fixed a bug with relative directories, closes issue #1

# Version 0.2.3

  * Added inline assignment of coffeescript expression for haml tags

# Version 0.1.12

  * Attribute values can be coffeescript expressions

# Version 0.1.11

  * Fixed bug with attribute comma separation

# Version 0.1.8

  * Bugfix with long text
  * Refactor tests into valid and invalid cases
  * Add exit codes for binary
