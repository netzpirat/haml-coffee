# Haml Coffee Templates [![Build Status](https://secure.travis-ci.org/netzpirat/haml-coffee.png)](http://travis-ci.org/netzpirat/haml-coffee)

**This is a work in progress fork and a pull request will be made when stable.**

Haml Coffee is a Haml parser that understands CoffeeScript. It will generate a JavaSript template that can be rendered
to HTML. Those templates can be used in your [Backbone.js](http://documentcloud.github.com/backbone/) application.

It is heavily inspired by Tim Caswells [haml-js](https://github.com/creationix/haml-js). We developed it since we love
Haml & CoffeeScript and we don't want to have a media break in our tool chain. If you want to see it in action feel free
to take a look at our [website](http://www.9elements.com/).

We also written a motivational [blog post](http://9elements.com/io/?p=551) where we explain our tool chain.

## Installation

Haml Coffee isn't available in NPM now, you'll have to clone the repository and install it with `npm install`:

```bash
$ git clone git://github.com/9elements/haml-coffee.git
$ cd haml-coffee
$ npm install
```

You may want to have a look at the related projects section for alternative ways of getting Haml Coffee.

## Compile Haml Coffee

After the installation you will have a `haml-coffee` binary:

```bash
$ haml-coffee
Usage: node haml-coffee

Options:
  -i, --input                        Either a file or a directory name to be compiled            [required]
  -o, --output                       Set the output filename
  -n, --namespace                    Set a custom template namespace                             [default: "window.HAML"]
  -t, --template                     Set a custom template name
  -f, --format                       Set HTML output format, either `xhtml`, `html4` or `html5`  [default: "html5"]
  -e, --custom-html-escape           Set the custom HTML escaping function name
  --disable-html-attribute-escaping  Disable any HTML attribute escaping                         [boolean]
  --disable-html-escaping            Disable any HTML escaping                                   [boolean]
```

### `-i`/`--input` option

You can either specify a single template or a directory. When you supply a directory, templates are being searched
within it:

```bash
$ haml-coffee -i template.haml
```

This will generate a template with the same name but the extension changed to `jst`. The above command for example would
generate a template named `template.jst`.

Valid Haml Coffee template must have one of the following extensions: `.haml`, `.html.haml`, `.hamlc` or
`.html.hamlc`.

### `-o`/`--output` option

You can specify a single output file name to be used instead of the automatic generated output file name:

```bash
$ haml-coffee -i template.haml -o t.js
```

This creates a template named `t.js`. You can also set a directory as input and give a output file name for
concatenating all output into a single file:

```bash
$ haml-coffee -i templates -o all.js
```

This will create all the templates under the `templates` directory into a single, combined output file `all.js`.

### `-n`/`--namespace` option

Each template will register itself by default under the `window.HAML` namespace, but you can change the namespace with:

``` bash
$ haml-coffee -i template.haml -n exports.JST
```

### `-t`/`--template` option

Each template must have a unique name under which it can be addressed. By default the template name is derived from the
template file name, by stripping of all extensions and remove illegal characters. Directory names are converted to
nested namespaces under the default namespace.

For example, a template named `user/show-admin.html.haml` will result in a template name `window.HAML.user.show_admin`,
but you can override this behaviour:

``` bash
$ haml-coffee -i template.haml -n exports.JST -t other
```

Will result in a template that can be accessed with `exports.JST.other`.

### `-f`/`--format` option

The Haml parser knows different HTML formats to which a given template can be rendered and it must be one of:

* xhtml
* html4
* html5

Doctype, self-closing tags and attributes handling depends on this setting. Please consult the official
[Haml reference](http://haml-lang.com/docs/yardoc/file.HAML_REFERENCE.html) for more details.

### `-c`/`--custom-html-escape` option

Every data that is evaluated at render time will be escaped. The escaping function is included in every template and
with a growing number of templates, there is a lot of duplication that can be avoided in order to reduce your template
size.

You can specify an escape function that will be used to render the template:

```bash
$ haml-coffee -i template.haml -c HAML.escape
```

Now the escaping function isn't included in your template anymore and you have to make sure the function is available
when the template is rendered. The default implementation is quite simple:

```coffeescript
window.HAML.htmlEscape ||= (text) ->
  "#{ text }"
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/\'/g, '&apos;')
  .replace(/\"/g, '&quot;')
```

### `--disable-html-attribute-escaping` option

All dynamic generated HTML attributes are escaped by default, but can be turned off with:

```bash
$ haml-coffee -i template.haml --disable-html-attribute-escaping
```

### `--disable-html-escaping` option

Although not recommended, escaping can also be turned off completely:

```bash
$ haml-coffee -i template.haml --disable-html-escaping
```

## Render Haml Coffee

Your template is compiled into a JavaScript file that can be rendered by instantiating the template with data that to
be evaluated.

Consider the given template `template.haml`:

```haml
%h1
  = @project
%section.content
  %h2 Tags
  %ul
    - for tag in @tags
      %li
        = project
```

that has been successful compiled with:

```coffeescript
$ haml-coffe -i template.haml
```

Now you can render the template `template.jst` in the browser with:

```coffeescript
html = HAML.template({
  project : "Haml Coffee"
  tags : ['Haml', 'CoffeeScript']
})
```

And the following HTML will be rendered to the variable `haml`:

```html
<h1>
  Haml Coffee
</h1>
<section class='content'>
  <h2>Tags</h2>
  <ul>
    <li>
      Haml
    </li>
    <li>
      CoffeeScript
    </li>
  </ul>
</section>
```

The generated template function will be called using the hash as context, so inside the templates you can access all
keys using `this` or `@`.

## Haml support

Haml Coffee implements the [Haml Spec](https://github.com/norman/haml-spec) to ensure some degree of compatibility
to other implementations, and the following sections are fully compatible to Ruby Haml:

* Plain text
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

Haml Coffee supports both, Ruby 1.8 and Ruby 1.9 style attributes:

```haml
%a{ :href => 'http://haml-lang.com/' } Haml
```

can also be written as:

```haml
%a{ href: 'http://haml-lang.com/' } Haml
```

### Differences to Ruby Haml

* HTML5 custom data attributes are not implemented.

## CoffeeScript support

Haml and CoffeeScript are a winning team, both use indention for blocks and are a perfect match for this reason.
You can use CoffeeScript instead of Ruby in your Haml tags and the attributes.

**It's not recommended to put too much logic into the template, but simple conditions and loops are fine.**

### Attributes

When you defining a tag attribute without putting it into quotes (single or double quote), it's considered to be code
to be run at render time. By default, attributes values from CoffeeScript code is escaped before inserted into the
document. You can turn off attribute escaping with the `--disable-html-attribute-escaping` compile option.

HTML style attributes are the most limited and can only assign a simple local variable:

```haml
%img(src='/images/demo.png' width=@width height=@height alt=alt)
```

Both the `@width` and `@height` values must be passed as context when rendering the template, and `alt` must be defined
before it.

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

By default, all inserted content from running code is escaped. You can turn it off with the `--disable-html-escaping`
compile option. There are three variations for run code and insert into the document, two of them to change the escaping
style chosen in the compile option:

* Run code and do not escape the result: `!=`
* Run code and escape the result: `&=`
* Preserve whitespace when insert the result: `~`

Again, please consult the official [Haml reference](http://haml-lang.com/docs/yardoc/file.HAML_REFERENCE.html) for more
details. Haml Coffee implements the same functionality like Ruby Haml, only for CoffeeScript.

Running code is able to define functions that generates Haml:

```haml
- sum(a, b) ->
  #div
    #span= a
    #span= b
    #span= a+b
= sum(1,2)
= sum(3,4)
```

### CoffeeScript filter

In addition to the filters `:plain`, `:javascript`, `:css`, `:cdata`, `:escaped` and `:preserve`, which are also
provided by Ruby Haml, Haml Coffee has a `:coffeescript` filter.

The content of the `:coffeescript` filter is run when the template is rendered and doesn't output anything into the
resulting document. This comes in handy when have code to run over multiple lines and don't want to prefix each line
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

## Related projects

Haml Coffee in the  Rails asset pipeline:

* [haml-coffee-assets](https://github.com/netzpirat/haml_coffee_assets)
* [ruby-haml-coffe](https://github.com/bfrydl/ruby-haml-coffee)
* [haml-coffee-rails](https://github.com/voidseeker/haml-coffee-rails)

## Development

You'll need the latest version of `node.js`, `npm`, `coffee-script` and `jasmine-node` to run everything. Start
the CoffeeScript compilation in the project root directory by running:

```bash
$ cake watch
```

And run the tests by calling:

```bash
$ jasmine-node
```

You can optionally install [Guard](https://github.com/guard/guard) with the [Bundler](http://gembundler.com/):

```bash
$ bundle install
```

and run Guard to automatically compile your CoffeeScripts and run the Jasmine specs on file modification:

```bash
$ bundle exec guard
```

## Changelog

Feel free to take a look at the [changelog](https://github.com/9elements/haml-coffee/blob/master/CHANGELOG.md).

## Authors

* [Sebastion Deutsch](https://github.com/sebastiandeutsch) ([@sippndipp](http://twitter.com/#!/sippndipp))
* [Michael Kessler](https://github.com/netzpirat) ([@netzpirat](http://twitter.com/#!/netzpirat))
* [Jan Varwig](https://github.com/janv) ([@agento](http://twitter.com/#!/agento))

## Contributors

See all contributors on [the contributor page](https://github.com/9elements/haml-coffee/contributors).

## License

(The MIT License)

Copyright (c) 2011 9elements

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
