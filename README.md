# Haml CoffeeScript Templates [![Build Status](https://secure.travis-ci.org/netzpirat/haml-coffee)](http://travis-ci.org/netzpirat/haml-coffee.png)

**This is a work in progress fork and a pull request will be made when stable.**

Haml CoffeeScript is a Haml parser that understands CoffeeScript. It will generate a JavaSript template that can be rendered
to HTML. Those templates can be used in your [Backbone.js](http://documentcloud.github.com/backbone/) application.

It is heavily inspired by Tim Caswells [haml-js](https://github.com/creationix/haml-js). We developed it since we love
Haml & CoffeeScript and we don't want to have a media break in our tool chain. If you want to see it in action feel free
to take a look at our [website](http://www.9elements.com/).

We also written a motivational [blog post](http://9elements.com/io/?p=551) where we explain our tool chain.

## Installation

Clone the repository and install with `npm`:

```bash
$ git clone git://github.com/9elements/haml-coffee.git
$ cd haml-coffee
$ npm install
```

We will publish it to npm soon.

## Compile Haml CoffeeScript

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

## Render Haml CoffeeScript

Your template is compiled into a JavaScript file that can be rendered by instantiating the template with data that to
be evaluated.

Consider the given template `template.haml`:

```haml
%h1
  = @title
%section.content
  %ul
    - for project in @projects
      %li
        = project
```

that has been successful compiled with:

```coffeescript
$ haml-coffe -i template.haml
```

Now you can simply render the template `template.jst` in your browser with:

```coffeescript
html = HAML.template({
  title : "foo bar"
  projects : ['haml', 'coffee', 'parser']
})
```

The generated template function will be called using the hash as context, so inside the templates you can access all
keys using `this` or `@`.

## Haml support

Haml CoffeeScript implements the [Haml Spec](https://github.com/norman/haml-spec) to ensure some degree of compatibility
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

### Differences to Ruby Haml

* HTML5 custom data attributes are not implemented.

## Related projects

Haml CoffeeScript in the  Rails asset pipeline:

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
