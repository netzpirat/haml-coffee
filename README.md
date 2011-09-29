# About

haml-coffee is a haml parser that understands coffeescript. It will generate a javascript file which contains
all templates that can be rendered to html. Those templates can be used in your [backbone.js](http://documentcloud.github.com/backbone/) application. It is heavily inspired by Tim Caswells [haml-js](https://github.com/creationix/haml-js). We developed it since we love haml - and we love coffeescript and we don't want to have a media break in our toolchain. If you want to see it in action feel free to take a look at our [website](http://www.9elements.com/). We also written a motivational [blog post](http://9elements.com/io/?p=551) where we explain our toolchain.

# Installation

Clone the repository and call

    npm install

To remove the repository. We will publish it to npm soon.

# Usage

After the installation you will have a haml-coffee binary. It can be called from the shell:

	Usage: haml-coffee
	
	Options:
	  -i, --input               Either a file or a directory name, in a directory all *.haml files will be processed  [required]
	  -o, --output              Output filename                                                                       [default: "compiled-haml.js"]
	  -n, --name                Template name, if you don't want the default one, derived from a filename           
	  --disable-html-escaping   Use this if you want to disable html escaping                                         [boolean]
	  -e, --custom-html-escape  Use this to pass a name of your custom html escaping function                       

The compiled-haml.js will create a HAML namespace that is attached to the window object. In case you took
a directory for input each file will be mapped to a function. You can generate the html like this:

    html = HAML.template_file_name()

If you need to pass some parameters inside you can do it like this:

    html = HAML.template_file_name({
      title : "foo bar"
      projects : ['haml', 'coffee', 'parser']
    })  

The generated function will be called using the hash as context, so inside the templates you can access all keys using CoffeeScripts @syntax:

    %h1
      = @title
    %section.content
      %ul
        - for project in @projects
          %li
            = project

This will give your haml templates a very rubish touch.

## HTML escaping

By default, `haml-coffee` will perform HTML escaping on evaluated data.
It can be turned off by passing the `--disable-html-escaping` option when running the binary.

If HTML escaping is turned on, compiler will insert a `window.HAML.html_escape` function in the generated template code.
If you wish to replace that function with your own, you can do so by running the binary with `--custom-html-escape=<name>` option, where `name` is a name of your function, e.g.:

    haml-coffee -i filename.haml --custom-html-escape=window.my_escape

This can help reduce the resulting code size, especially if you use many separately generated templates in your project.

# Develop

You'll need the latest version of node.js, npm, coffee-script, expresso and should to run everything.
Start the coffeescript compilation by running

    cake watch

in the project root directory. Run the tests by calling

    expresso

# Changelog

Feel free to take a look at the [changelog](https://github.com/9elements/haml-coffee/blob/master/CHANGELOG.md) document.

# Roadmap

There is a little [roadmap](https://github.com/9elements/haml-coffee/blob/master/TODO.md). One key ingredient would be
to make the output namespace not bound to window, but some something configurable. If we would have this we could use templates
on client and on server.

# License

Copyright (c) 2011 9elements, this project runs under MIT license
