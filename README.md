# Haml Coffee Templates [![Build Status](https://secure.travis-ci.org/netzpirat/haml-coffee.png)](http://travis-ci.org/netzpirat/haml-coffee)

Haml Coffee is a JavaScript templating solution that uses [Haml](http://haml-lang.com/) as markup, understands inline
[CoffeeScript](http://jashkenas.github.com/coffee-script/) and generates a JavaScript function that renders to HTML. It
can be used in client-side JavaScript applications that are using
[Backbone.js](http://documentcloud.github.com/backbone/), [Spine.js](http://spinejs.com/),
[JavaScriptMVC](http://javascriptmvc.com/), [KnockoutJS](http://knockoutjs.com/) and others, or on the server-side in
frameworks like [Express](http://expressjs.com/).

You can try Haml Coffee online by visiting [Haml Coffee Online](http://haml-coffee-online.herokuapp.com/).

## Installation

Haml Coffee is available in NPM and can be installed with:

```bash
$ npm install haml-coffee
```

Please have a look at the [CHANGELOG](https://github.com/netzpirat/haml-coffee/blob/master/CHANGELOG.md) when upgrading to a
newer Haml Coffee version with `npm update`.

## Integration

If you're using [Hem](https://github.com/maccman/hem) to manage your CommonJS modules,
use [hem-haml-coffee](https://github.com/vojto/hem-haml-coffee). This is excellent for
developing your [Spine](http://spinejs.com/) application.

If you like to integrate Haml Coffee seamless into the Rails asset pipeline, check out
[haml_coffee_assets](https://github.com/netzpirat/haml_coffee_assets).

If you like to compile your Haml Coffee templates with [Guard](https://github.com/guard/guard), you should give
[guard-haml-coffee](https://github.com/ouvrages/guard-haml-coffee) a try.

For using the Haml Coffee compiler in the browser, a [browserified](https://github.com/substack/node-browserify) version
is provided in the `dist/compiler` directory:
[Haml Coffee compiler](https://raw.github.com/netzpirat/haml-coffee/master/dist/compiler/hamlcoffee.js)
([minified](https://raw.github.com/netzpirat/haml-coffee/master/dist/compiler/hamlcoffee.min.js)). The browser
distribution doesn't come bundled with CoffeeScript, so you'll have to make sure you've included it before requiring
haml-coffee.

## Compile Haml Coffee

### Using the API

You can compile a Haml Coffee template to a JavaScript function and execute the function with the locals to render the
HTML. The following code

```coffeescript
hamlc = require 'haml-coffee'
tmpl = hamlc.compile '%h1= @title'
html = tmpl title: 'Haml Coffee rocks!'
```

will create the HTML `<h1>Haml Coffee rocks!</h1>`.

The `compile` function can take the compiler options as second parameter to customize the template function:

```coffeescript
hamlc.compile '%h1= @title'
  cleanValue: false
  escapeHtml: false
```

See the [compiler options](#compiler-options) for detailed information about all the available options and browse
the [codo](https://github.com/netzpirat/codo) generated
[Haml-Coffee API documentation](http://coffeedoc.info/github/netzpirat/haml-coffee/master/).

### Using with Express

You can configure [Express](http://expressjs.com/) to use Haml Coffee as template engine.

#### Express 3

Starting with version 1.4.0, Haml Coffee has support for Express 3 and can be registered as view engine as follows:

```coffeescript
express = require 'express'
app     = express()

app.engine 'hamlc', require('haml-coffee').__express
```

Alternatively you can also use [consolidate.js](https://github.com/visionmedia/consolidate.js) to register the engine:

```coffeescript
express = require 'express'
cons    = require 'consolidate'
app     = express()

app.engine 'hamlc', cons['haml-coffee']);
```

#### Express 2

Starting with version 0.5.0, Haml Coffee has support for Express 2 and can be registered as view engine as follows:

```coffeescript
express = require 'express'

app = express.createServer()
app.register '.hamlc', require('haml-coffee')
```

Alternatively you can also use [consolidate.js](https://github.com/visionmedia/consolidate.js) to register the engine:

```coffeescript
express = require 'express'
cons    = require 'consolidate'

app = express.createServer()
app.register '.hamlc', cons['haml-coffee']
```

#### Usage

Express uses a layout file `layout.hamlc` by default and you have to insert the rendered view body into the layout like
this:

```haml
!!!
%head
  %title Express App
%body
  != @body
```

Now you can create a Haml Coffee view

```haml
%h1= "Welcome #{ @name }"
%p You've rendered your first Haml Coffee view.
```

that you can render with:

```coffeescript
app.get '/', (req, res) ->
  res.render 'index.hamlc', name: 'Express user'
```

#### Default template engine

It's possible to use Haml Coffee as the default template engine by setting the `view engine`:

```coffeescript
app.configure ->
  app.set 'view engine', 'hamlc'
```

which allows you to omit the `.hamlc` extension when rendering a template:

```coffeescript
app.get '/', (req, res) ->
  res.render 'index', name: 'Express user'
```

#### Compiler options

With Express 3, you can set global compiler options by using `app.locals`:

```
app.locals.uglify = true
```

which is the same as:

```
res.render view, { uglify: true }
```

See the [compiler options](#compiler-options) for detailed information about all the available options.

### Using the CLI tool

After the installation you will have a `haml-coffee` binary that can be used to compile single templates and even
compile multiple templates recursively into a single file.

```bash
$ haml-coffee
Usage: node haml-coffee

Options:
  -i, --input                        Either a file or a directory name to be compiled
  -o, --output                       Set the output filename
  -n, --namespace                    Set a custom template namespace
  -t, --template                     Set a custom template name
  -b, --basename                     Ignore file path when generate the template name
  -e, --extend                       Extend the template scope with the context
```

_The following section describes only the options that are unique to the command line tool._

You can see all the available options by executing `haml-coffee --help` and have a look at the
[compiler options](#compiler-options) for detailed information about all the options.

#### Input filename

You can either specify a single template or a directory with the `-i`/`--input` argument. When you supply a directory,
templates are being searched recursively:

```bash
$ haml-coffee -i template.haml
```

This will generate a template with the same name as the file but the extension changed to `.jst`. The above command for
example would generate a template named `template.jst`.

A valid Haml Coffee template must have one of the following extensions: `.haml`, `.html.haml`, `.hamlc` or
`.html.hamlc`.

#### Output filename

You can specify a single output file name to be used instead of the automatic generated output file name with the
`-o`/`--output` argument:

```bash
$ haml-coffee -i template.haml -o t.js
```

This creates a template named `t.js`. You can also set a directory as input and give an output file name for
concatenating all templates into a single file:

```bash
$ haml-coffee -i templates -o all.js
```

This will create all the templates under the `templates` directory into a single, combined output file `all.js`.

#### Template namespace

Each template will register itself by default under the `window.HAML` namespace, but you can change the namespace with
the `-n`/`--namespace` argument:

```bash
$ haml-coffee -i template.haml -n exports.JST
```

#### Template name

Each template must have a unique name under which it can be addressed. By default the template name is derived from the
template file name by stripping off all extensions and remove illegal characters. Directory names are converted to
nested namespaces under the default namespace. For example, a template named `user/show-admin.html.haml` will result in
a template that can be accessed by `window.HAML['user/show_admin']`.

Given the `-b`/`--basename` argument, the deduced template name will not include the path to the template. For example,
a template named `user/show-admin.html.haml` will result in a template that can be accessed by
`window.HAML['show_admin']` instead of `window.HAML['user/show_admin']`.

With the `-t`/`--template` argument you can set a template name manually:

```bash
$ haml-coffee -i template.haml -n exports.JST -t other
```

This will result in a template that can be accessed by `exports.JST['other']`.

#### Extend the template scope

By extending the template scope with the context, you can access your context data without `@` or `this`:

```Haml
%h2= title
```

This effect is achieved by using the [with](https://developer.mozilla.org/en/JavaScript/Reference/Statements/with)
statement. Using with is forbidden in ECMAScript 5 strict mode.

## Haml support

Haml Coffee implements the [Haml Spec](https://github.com/norman/haml-spec) to ensure some degree of compatibility to
other Haml implementations and the following sections are fully compatible to Ruby Haml:

* Plain text
* Multiline: `|`
* Element names `%`
* Attributes: `{}` or `()`
* Class and ID: `.` and `#`, implicit `div` elements
* Self-closing tags: `/`
* Doctype: `!!!`
* HTML comments: `/`, conditional comments: `/[]`, Haml comments: `-#`
* Running CoffeeScript: `-`, inserting CoffeeScript: `=`
* CoffeeScript interpolation: `#{}`
* Whitespace preservation: `~`
* Whitespace removal: `>` and `<`
* Escaping `\`
* Escaping HTML: `&=`, unescaping HTML: `!=`
* Filters: `:plain`, `:javascript`, `:css`, `:cdata`, `:escaped`, `:preserve`
* Boolean attributes conversion

Please consult the official [Haml reference](http://haml-lang.com/docs/yardoc/file.HAML_REFERENCE.html) for more
details.

Haml Coffee supports both Ruby 1.8 and Ruby 1.9 style attributes. So the following Ruby 1.8 style attribute

```haml
%a{ :href => 'http://haml-lang.com/', :title => 'Haml home' } Haml
```

can also be written in Ruby 1.9 style:

```haml
%a{ href: 'http://haml-lang.com/', title: 'Haml home' } Haml
```

HTML style tags are also supported:

```haml
%a( href='http://haml-lang.com/' title='Haml home') Haml
```

### Helpers

Haml Coffee supports a small subset of the Ruby Haml [helpers](http://haml-lang.com/docs/yardoc/Haml/Helpers.html). The
provided helpers will bind the helper function to the template context, so it isn't necessary to use `=>`.

#### Surround

Surrounds a block of Haml code with strings, with no whitespace in between.

```haml
!= surround '(', ')', ->
  %a{:href => "food"} chicken
```

produces the HTML output

```html
(<a href='food'>chicken</a>)
```

#### Succeed

Appends a string to the end of a Haml block, with no whitespace between.

```haml
click
!= succeed '.', ->
  %a{:href=>"thing"} here
```

produces the HTML output

```html
click
<a href='thing'>here</a>.
```

#### Precede

Prepends a string to the beginning of a Haml block, with no whitespace between.

```haml
!= precede '*', ->
  %span.small Not really
```

produces the HTML output

```html
*<span class='small'>Not really</span>
```

## CoffeeScript support

Haml and CoffeeScript are a winning team, both use indention for blocks and are a perfect match for this reason. You can
use CoffeeScript instead of Ruby in your Haml tags and the attributes.

**It's not recommended to put too much logic into the template.**

### Attributes

When you define an attribute value without putting it into quotes (single or double quotes), it's considered to be
CoffeeScript code to be run at render time. By default, attributes values from CoffeeScript code are escaped before
inserting into the document. You can change this behaviour by setting the appropriate compiler option.

HTML style attributes are the most limited and can only assign a simple variable:

```haml
%img(src='/images/demo.png' width=@width height=@height alt=alt)
```

Both the `@width` and `@height` values must be passed as locals when rendering the template and `alt` must be defined
before the `%img` tag.

Ruby style tags can be more complex and can call functions:

```haml
%header
  %user{ :class => App.currentUser.get('status') }= App.currentUser.getDisplayName()
```

Attribute definitions are also supported in the Ruby 1.9 style:

```haml
%header
  %user{ class: App.currentUser.get('status') }= App.currentUser.getDisplayName()
```

More fancy stuff can be done when use interpolation within a double quoted attribute value:

```haml
%header
  %user{ class: "#{ if @user.get('roles').indexOf('admin') is -1 then 'normal' else 'admin' }" }= @user.getDisplayName()
```

_But think twice about it before putting such fancy stuff into your template, there are better places like models,
views or helpers to put heavy logic into._

You can define your attributes over multiple lines and the next line must not be correctly indented, so you can align
them properly:

```haml
%input#password.hint{ type: 'password', name: 'registration[password]',
                      data: { hint: 'Something very important', align: 'left' } }
```

In the above example you also see the usage for generating HTML5 data attributes.

### Running Code

You can run any CoffeeScript code in your template:

```haml
- for project in @projects
  - if project.visible
    .project
      %h1= project.name
      %p&= project.description
```

There are several supported types to run your code:

* Run code without insert anything into the document: `-`
* Run code and insert the result into the document: `=`

All inserted content from running code is escaped by default. You can change this behaviour by setting the appropriate
compiler option.

There are three variations to run code and insert its result into the document, two of them to change the escaping style
chosen in the compile option:

* Run code and do not escape the result: `!=`
* Run code and escape the result: `&=`
* Preserve whitespace when insert the result: `~`

Again, please consult the official [Haml reference](http://haml-lang.com/docs/yardoc/file.HAML_REFERENCE.html) for more
details. Haml Coffee implements the same functionality like Ruby Haml, only for CoffeeScript.

#### Multiline code blocks

Running code must be placed on a single line and unlike Ruby Haml, you cannot stretch a it over multiple lines by
putting a comma at the end.

However, you can use multiline endings `|` to stretch your code over multiple lines to some extend:

```Haml
- links = {          |
    home: '/',       |
    docs: '/docs',   |
    about: '/about'  |
  }                  |

%ul
  - for name, link of links
    %li
      %a{ href: link }= name
```

Please note, that since the line is concatenated before the compilation, you cannot omit the curly braces and the
commas in the above example, like you'd do in normal CoffeeScript code. Therefore it's recommended to use the
CoffeeScript filter to have real multiline code blocks:

```Haml
:coffeescript
  links =
    home: '/'
    docs: '/docs'
    about: '/about'

%ul
  - for name, link of links
    %li
      %a{ href: link }= name
```

#### Functions

You can also create functions that generate Haml:

```haml
- sum = (a, b) ->
  %div
    %span= a
    %span= b
    %span= a+b
= sum(1,2)
= sum(3,4)
```

or pass generated HTML output through a function for post-processing.

```haml
= postProcess ->
  %a{ href: '/' }
```

The content of the `:coffeescript` filter is run when the template is rendered and doesn't output anything into the
resulting document. This comes in handy when you have code to run over multiple lines and don't want to prefix each line
with `-`:

```haml
%body
  :coffeescript
    tags = ['CoffeeScript', 'Haml']
    project = 'Haml Coffee'
  %h2= project
  %ul
    - for tag in tags
      %li= tag
```

## Compiler options

The following section describes all the available compiler options that you can use through the JavaScript API,
as Express view option or as argument to the command line utility.

The command line arguments may be slightly different. For example instead of passing `--escape-html=false` you have to
use the `--disable-html-escaping` argument. You can see a list of all the command line arguments by executing
`haml-coffee --help`.

### HTML generation options

The HTML options change the way how the generated HTML will look like.

#### Output format

* Name: 'format'
* Type: `String`
* Default: `html5`

The Haml parser knows different HTML formats to which a given template can be rendered and it must be one of:

* xhtml
* html4
* html5

Doctype, self-closing tags and attributes handling depends on this setting. Please consult the official
[Haml reference](http://haml-lang.com/docs/yardoc/file.HAML_REFERENCE.html) for more details.

#### Uglify output

* Name: `uglify`
* Type: `Boolean`
* Default: `false`

All generated HTML tags are properly indented by default, so the output looks nice. This can be helpful when debugging.
You can skip the indention by setting the `uglify` option to false. This save you some bytes and you'll have increased
rendering speed.

#### HTML escape

* Name: `htmlEscape`
* Type: `Boolean`
* Default: `true`

The reserved HTML characters `"`, `'`, `&`, `<` and `>` are converted to their HTML entities by default when they are
inserted into the HTML document from evaluated CoffeeScript.

You can always change the escaping mode within the template to either force escaping with `&=` or force unescaping with
`!=`.

#### Attributes escape

* Name: `escapeAttributes`
* Type: `Boolean`
* Default: `true`

All HTML attributes that are generated by evaluating CoffeeScript are also escaped by default. You can turn of HTML
escaping of the attributes only by setting `escapeAttributes` to false. You can't change this behaviour in the template
since there is no Haml markup for this to instruct the compiler to change the escaping mode.

#### Clean CoffeeScript values

* Name: `cleanValue`
* Type: `Boolean`
* Default: `true`

Every output that is generated from evaluating CoffeeScript code is cleaned before inserting into the document. The
default implementation converts `null` or `undefined` values into an empty string and marks real boolean values with a
hidden marker character. The hidden marker character is necessary to distinguish between String values like `'true'`,
`'false'` and real boolean values `true`, `false` in the markup, so that a boolean attribute conversion can quickly
convert these values to the correct HTML5/XHTML/HTML4 representation.

#### Preserve whitespace tags

* Name: `preserve`
* Type: `String`
* Default: `textarea,pre`

The `preserve` option defines a list of comma separated HTML tags that are whitespace sensitive. Content from these tags
must be preserved, so that the indention has no influence on the displayed content. This is simply done by converting
the newline characters to their equivalent HTML entity.

#### Autoclose tags

* Name: `autoclose`
* Type: `String`
* Default: `meta,img,link,br,hr,input,area,param,col,base`

The autoclose option defines a list of tag names that should be automatically closed if they have no content.

#### Module loader support

* Name: `placement`
* Type: `String`
* Default: `global`

The `placement` option defines where the template function is inserted
upon compilation.

Possible values are:

* `global` <br />
  Inserts the optionally namespaced template function into `window.HAML`.

* `amd` <br />
  Wraps the template function into a `define()` statement to allow async
  loading via AMD.

### Custom helper function options

Haml Coffee provides helper functions for HTML escaping, value cleaning and whitespace preservation, which must be
available at render time. By default every generated template function is self-contained and includes all of the helper
functions.

However you can change the reference to each helper function by providing the appropriate compiler option and there
are good reasons to do so:

* You want to reduce the template size and provide all the helpers from a central place.
* You want to customize a helper function to better fit your needs.

To change these functions, simply assign the new function name to one of the following options:

  * `customHtmlEscape`: Escape the reserved HTML characters into their equivalent HTML entity.
  * `customPreserve`: Converting newlines into their HTML entity.
  * `customFindAndPreserve`: Find whitespace sensitive tags and preserve their content.
  * `customCleanValue`: Clean the value that is returned after evaluating some inline CoffeeScript.
  * `customSurround`: Surrounds a block of Haml code with strings, with no whitespace in between.
  * `customSucceed`: Appends a string to the end of a Haml block, with no whitespace between.
  * `customPrecede`: Prepends a string to the beginning of a Haml block, with no whitespace between.


The `customSurround`, `customSucceed` and `customPrecede` are bound to the template context.

You can find a default implementation for all these helper functions in
[Haml Coffee Assets](https://github.com/netzpirat/haml_coffee_assets/blob/master/vendor/assets/javascripts/hamlcoffee.js.coffee.erb).

## Development information

Haml-Coffee uses [Guard](https://github.com/guard/guard) for development, which you can install Guard with the Ruby
[Bundler](http://gembundler.com/):

```bash
$ bundle install
```

Install the Node modules with [NPM](https://npmjs.org/):

```bash
$ npm install
```

and run Guard to automatically compile your CoffeeScripts and run the Jasmine specs on file modification:

```bash
$ bundle exec guard
```

## Changelog

Feel free to take a look at the crispy [changelog](https://github.com/netzpirat/haml-coffee/blob/master/CHANGELOG.md)
instead of crawling through the commit history.

## Related projects

Haml Coffee in the  Rails asset pipeline:

* [haml-coffee-assets](https://github.com/netzpirat/haml_coffee_assets)

## Authors

* [Michael Kessler](https://github.com/netzpirat) ([@netzpirat](http://twitter.com/#!/netzpirat), [mksoft.ch](https://mksoft.ch))
* [Sebastion Deutsch](https://github.com/sebastiandeutsch) ([@sippndipp](http://twitter.com/#!/sippndipp), [9elements](http://9elements.com))
* [Jan Varwig](https://github.com/janv) ([@agento](http://twitter.com/#!/agento), [9elements](http://9elements.com))

## Contributors

See all contributors on [the contributor page](https://github.com/netzpirat/haml-coffee/contributors).

## License

(The MIT License)

Copyright (c) 2011-2012 9elements, Michael Kessler

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
