# About

haml-coffee is a haml parser that understands coffeescript. It will generate a javascript file which contains
all templates that can be rendered to html. Those templates can be used in your [backbone.js](http://documentcloud.github.com/backbone/) application. It is heavily inspired by Tim Caswells [haml-js](https://github.com/creationix/haml-js). We developed it since we love haml - and we love coffeescript and we don't want to have a media break in our toolchain. If you want to see it in action feel free to take a look at our [website](http://www.9elements.com/). We also written a motivational [blog post](http://9elements.com/io/?p=551) where we explain our toolchain.

# Installation

Clone the repository and call

    npm install

To remove the repository. We will publish it to npm soon.

# Usage

After the installation you will have a haml-coffee binary. It can be called from the shell:

    haml-coffee INPUT [OUTPUT]
      
      INPUT may be a file or directory, in a directory all *.haml files will be processed
      OUTPUT is an optional argument, the default output file is 'compiled-haml.js'

The compiled-haml.js will create a HAML namespace that is attached to the window object. In case you took
a directory for input each file will be mapped to a function. You can generate the html like this:

    html = HAML.template_file_name()

If you need to pass some paramters inside you can do it like this:

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
