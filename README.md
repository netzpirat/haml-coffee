# Haml Coffee Templates [![Build Status](https://secure.travis-ci.org/9elements/haml-coffee.png)](http://travis-ci.org/9elements/haml-coffee)

Haml Coffee is a JavaScript templating solution that uses [Haml](http://haml-lang.com/) as markup and understands inline
[CoffeeScript](http://jashkenas.github.com/coffee-script/) to generate a JavaScript function that renders to HTML. It
can be used in client-side JavaScript applications that are using
[Backbone.js](http://documentcloud.github.com/backbone/), [Spine.js](http://spinejs.com/),
[JavaScriptMVC](http://javascriptmvc.com/), [KnockoutJS](http://knockoutjs.com/) and others, or on the server-side in
framworks like [Express](http://expressjs.com/).

## Contents

* [Installation](#installation)
* [Compile Haml Coffee](#compile-haml-coffee)
  * [Using the API](#using-the-api)
  * [Using with Express](#using-with-express)
  * [Using the CLI tool](#using-the-cli-tool)
* [Haml support](#haml-support)
* [CoffeeScript support](#coffee-script-support)
  * [Attributes](#coffee-script-attributes)
  * [Running code](#coffee-script-running-code)
  * [Filter](#coffee-script-filter)
* [Compiler options](#compiler-options)
  * [HTML generation options](#html-generation-compiler-options)
  * [Custom helper function options](#custom-helper-function-compiler-options)
* [Development information](#development-information)

<a name="installation" />
## Installation

Haml Coffee is available in NPM and you can be installed with:

```bash
$ npm install haml-coffee
```

If you like to integrate Haml Coffee into the Rails 3.1 asset pipeline, check out
[haml_coffee_assets](https://github.com/netzpirat/haml_coffee_assets).

For using Haml Coffee compiler in the Browser, a [browserified](https://github.com/substack/node-browserify) version is
provided:

* [Client-side compiler](https://raw.github.com/9elements/haml-coffee/master/dist/compiler/hamlcoffee.js) ([minified](https://raw.github.com/9elements/haml-coffee/master/dist/compiler/hamlcoffee.min.js))

<a name="compile-haml-coffee" />
## Compile Haml Coffee

<a name="using-the-api" />
### Using the API

You can compile a Haml Coffee template to a JavaScript function and execute the function with the locals to render the
HTML. The following code

```coffee-script
hamlc = require 'haml-coffee'
tmpl = hamlc.compile '%h1= @title'
html = tmpl title: 'Introduction'
```

will create the HTML `<h1>Introduction</h1>`.

The `compile` function can take the compiler options as second parameter to customize the template function:

```coffee-script
options =
  cleanValue: false
  escapeHtml: false
hamlc.compile '%h1= @title', options
```

See the [compiler options](#compiler-options) for detailed information about all the available options.

<a name="using-with-express" />
## Using with Express

You can configure [Express](http://expressjs.com/) to use Haml Coffee as template engine:

```coffee-script
express = require 'express'
hamlc = require 'haml-coffee'

app = express.createServer()
app.register '.hamlc', hamlc
```

Express uses a layout file `layout.hamlc` by default and you have to insert the rendered view body into the layout like
this:

```haml
!!! 5
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

```coffee-script
app.get '/', (req, res) ->
  res.render 'index.hamlc', name: 'Express user'
```

You can also turn off the layout rendering by configure the `view options`:

```coffee-script
app.set 'view options', layout: false
```

See the [compiler options](#compiler-options) for detailed information about all the available options.

It's possible to use Haml Coffee as the default template engine by setting the `view engine`:

```coffee-script
app.configure ->
  app.set 'view engine', 'hamlc'
```

which allows you to omit then `.hamlc` extension when rendering a template:

```coffee-script
app.get '/', (req, res) ->
  res.render 'index', name: 'Express user'
```

You can read more about the view rednering in the
[Express documentation](http://expressjs.com/guide.html#view-rendering).

<a name="using-the-cli-tool" />
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
```

The following section describes only the options that are unique to the command line tool. You can see all the available
options by executing `haml-coffee --help` and have a look at the [compiler options](#compiler-options) for detailed
information about all the options.

#### `-i`/`--input` argument

You can either specify a single template or a directory. When you supply a directory, templates are being searched
recursively:

```bash
$ haml-coffee -i template.haml
```

This will generate a template with the same name as the file but the extension changed to `jst`. The above command for
example would generate a template named `template.jst`.

A valid Haml Coffee template must have one of the following extensions: `.haml`, `.html.haml`, `.hamlc` or
`.html.hamlc`.

#### `-o`/`--output` argument

You can specify a single output file name to be used instead of the automatic generated output file name:

```bash
$ haml-coffee -i template.haml -o t.js
```

This creates a template named `t.js`. You can also set a directory as input and give an output file name for
concatenating all templates into a single file:

```bash
$ haml-coffee -i templates -o all.js
```

This will create all the templates under the `templates` directory into a single, combined output file `all.js`.

### `-n`/`--namespace` argument

Each template will register itself by default under the `window.HAML` namespace, but you can change the namespace with:

```bash
$ haml-coffee -i template.haml -n exports.JST
```

### `-t`/`--template` argument

Each template must have a unique name under which it can be addressed. By default the template name is derived from the
template file name by stripping off all extensions and remove illegal characters. Directory names are converted to
nested namespaces under the default namespace.

For example, a template named `user/show-admin.html.haml` will result in a template that can be accessed by
`window.HAML.user.show_admin`. You can set a template name manually with:

```bash
$ haml-coffee -i template.haml -n exports.JST -t other
```

This will result in a template that can be accessed by `exports.JST.other`.

<a name="haml-support" />
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
* findAndPreserve helper

Please consult the official [Haml reference](http://haml-lang.com/docs/yardoc/file.HAML_REFERENCE.html) for more
details.

Haml Coffee supports both Ruby 1.8 and Ruby 1.9 style attributes. So the following Ruby 1.8 style attributes

```haml
%a{ :href => 'http://haml-lang.com/' } Haml
```

can also be written in Ruby 1.9 style:

```haml
%a{ href: 'http://haml-lang.com/' } Haml
```

<a name="coffee-script-support" />
## CoffeeScript support

Haml and CoffeeScript are a winning team, both use indention for blocks and are a perfect match for this reason. You can
use CoffeeScript instead of Ruby in your Haml tags and the attributes.

**It's not recommended to put too much logic into the template, but simple conditions and loops are fine.**

<a name="coffee-script-attributes" />
### Attributes

When you define a tag attribute without putting it into quotes (single or double quote), it's considered to be
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

More fancy stuff can be done when use interpolation within a quoted attribute:

```haml
%header
  %user{ class: "#{ if @user.get('roles').indexOf('admin') is -1 then 'normal' else 'admin' }" }= @user.getDisplayName()
```

But think about it twice before putting such fancy stuff into your template, there are better places like models,
controllers or helpers to put heavy logic into.

You can define your attributes over multiple lines and the next line must not be indented properly, so you can align
them properly:

```haml
%input#password.hint{ type: 'password', name: 'registration[password]',
                      data: { hint: "Something very imporant", align: 'left' } }
```

In the above example you see the usage for generating HTML data attributes.

<a name="coffee-script-running-code" />
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

You can also create functions that generate Haml:

```haml
- sum(a, b) ->
  #div
    #span= a
    #span= b
    #span= a+b
= sum(1,2)
= sum(3,4)
```

<a name="coffee-script-filter" />
### CoffeeScript filter

In addition to the `:plain`, `:javascript`, `:css`, `:cdata`, `:escaped` and `:preserve` filters, which are also
provided by Ruby Haml, Haml Coffee has a `:coffeescript` filter.

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

<a name="compiler-options" />
## Compiler options

The following section describes all the available compiler options that use can use through the JavaScript API,
as Express view option or as argument to the command line utility.

The command line arguments may be slightly different. For example instead of passing `--escape-html=false` you have to
use the `--disable-html-escaping` argument. You can see a list of all the command line arguments by executing
`haml-coffee --help`.

<a name="html-generation-compiler-options" />
### HTML generation options

The HTML options change the way how the generated HTML will look.

#### The `format` option

* Type: `String`
* Default: `html5`

The Haml parser knows different HTML formats to which a given template can be rendered and it must be one of:

* xhtml
* html4
* html5

Doctype, self-closing tags and attributes handling depends on this setting. Please consult the official
[Haml reference](http://haml-lang.com/docs/yardoc/file.HAML_REFERENCE.html) for more details.

#### The `uglify` option

* Type: `Boolean`
* Default: `false`

All generated HTML tags are properly indented by default and the output looks nice, which can be helpful for debugging.
You can skip the indention by setting the `uglify` option to false. This save you some bytes and you'll have increased
rendering speed.

#### The `htmlEscape` option

* Type: `Boolean`
* Default: `true`

The reserved HTML characters `"`, `'`, `&`, `<` and `>` are converted to their HTML entities by default when they are
inserted into the HTML document from evaluated CoffeeScript.

You can always change the escaping mode within the template to either force escaping with `&=` or force unescaping with
`!=`.

#### The `escapeAttributes` option

* Type: `Boolean`
* Default: `true`

All HTML attributes that are generated by evaluating CoffeeScript are also escaped by default. You can turn of HTML
escaping of the attributes only by setting `escapeAttributes` to false. You can't change this behaviour in the template
since there is no Haml markup for this to instruct the compiler to change the escaping mode.

#### The `cleanValue` option

* Type: `Boolean`
* Default: `true`

Every output that is generated from evaluating CoffeeScript code is cleaned before inserting into the document. The
default implementation converts `null` or `undefined` values into an empty string.

#### The `preserve` option

* Type: `String`
* Default: `textarea,pre`

The `preserve` option defines a list of comma separated HTML tags that are whitespace sensitive. Content from these tags
must be preserved, so that the indention has no influence on the displayed content. This is simply done by converting
the newline characters to their equivalent HTML entity and the content is merged into a single line.

#### The `autoclose` option

* Type: `String`
* Default: `meta,img,link,br,hr,input,area,param,col,base`

The autoclose option defines a list of tag names that should be automatically closed if they have no content.

<a name="custom-helper-function-compiler-options" />
### Custom helper function options

Haml Coffee provides a bunch of helper functions for HTML escaping, value cleaning, whitespace preservation that must be
available at render time. By default every generated template function is self-contained and includes all of the helper
functions.

However you can change the reference to each helper function by providing the appropriate compiler option, and there
are good reasons to do so:

* You want to reduce the template size and provide all the helpers from a central place.
* You want to customize a helper function to better fit your needs.

To change these functions, simply assign the new function name to one of the following options:

  * `customHtmlEscape`: Escape the reserved HTML characters into their equivalent HTML entity.
  * `customPreserve`: Converting newlines into their HTML entity.
  * `customFindAndPreserve`: Find whitespace sensitive tags and preserve their content.
  * `customCleanValue`: Clean the value that is returned after evaluating some inline CoffeeScript.

You can find the default implementation for all these helpers functions in the `dist` directory:

  * [CoffeeScript helpers](https://raw.github.com/9elements/haml-coffee/master/dist/helpers/haml_coffee_helpers.coffee)
  * [JavaScript helpers](https://raw.github.com/9elements/haml-coffee/master/dist/helpers/haml_coffee_helpers.js)

<a name="development-information" />
## Development information

You'll need the latest version of `node.js`, `npm`, `coffee-script` and `jasmine-node` to run everything. Start
the CoffeeScript compilation in the project root directory by running:

```bash
$ cake watch
```

And run the tests by calling:

```bash
$ jasmine-node
```

You can optionally install [Guard](https://github.com/guard/guard) with the Ruby [Bundler](http://gembundler.com/):

```bash
$ bundle install
```

and run Guard to automatically compile your CoffeeScripts and run the Jasmine specs on file modification:

```bash
$ bundle exec guard
```

## Changelog

Feel free to take a look at the crispy [changelog](https://github.com/9elements/haml-coffee/blob/master/CHANGELOG.md)
instead of crawling through the commit history.

## Related projects

Haml Coffee in the  Rails asset pipeline:

* [haml-coffee-assets](https://github.com/netzpirat/haml_coffee_assets)

## Authors

* [Michael Kessler](https://github.com/netzpirat) ([@netzpirat](http://twitter.com/#!/netzpirat))
* [Sebastion Deutsch](https://github.com/sebastiandeutsch) ([@sippndipp](http://twitter.com/#!/sippndipp))
* [Jan Varwig](https://github.com/janv) ([@agento](http://twitter.com/#!/agento))

## Contributors

See all contributors on [the contributor page](https://github.com/9elements/haml-coffee/contributors).

## License

(The MIT License)

Copyright (c) 2011 9elements, Michael Kessler

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
