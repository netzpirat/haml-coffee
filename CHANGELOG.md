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