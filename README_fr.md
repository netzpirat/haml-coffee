# Haml Coffee Templates [![Build Status](https://secure.travis-ci.org/netzpirat/haml-coffee.png)](http://travis-ci.org/netzpirat/haml-coffee)

Haml Coffee est un moteur de template en JavaScript utilisant la syntaxe [Haml](http://haml-lang.com/), tout en comprenant
[CoffeeScript](http://jashkenas.github.com/coffee-script/) pour générer une fonction function qui donnera du HTML.
Il est possible de l'utiliser dans des applications JavaScript côté client, par exemple avec
[Backbone.js](http://documentcloud.github.com/backbone/), [Spine.js](http://spinejs.com/),
[JavaScriptMVC](http://javascriptmvc.com/), [KnockoutJS](http://knockoutjs.com/) ou d'autres, ou côté serveur avec des frameworks comme [Express](http://expressjs.com/).

Vous pouvez essayer Haml Coffee en ligne en visitant [Haml Coffee Online](http://haml-coffee-online.herokuapp.com/).

## Installation

Haml Coffee est disponible via npm et peut être installé par la commande:

```bash
$ npm install haml-coffee
```

Pensez à vérifier le [CHANGELOG](https://github.com/netzpirat/haml-coffee/blob/master/CHANGELOG.md) lorsque vous mettez à jour votre version d'Haml Coffee avec `npm update`.

## Intégration

Il existe différent packages pour intégrer Haml-Coffee dans votre environnement de travail:

* [grunt-haml](https://github.com/concordusapps/grunt-haml) pour les projets utilisants [Grunt](http://gruntjs.com/).
* [hem-haml-coffee](https://github.com/vojto/hem-haml-coffee) pour les projets utilisants [Hem](https://github.com/maccman/hem/).
* [haml_coffee_assets](https://github.com/netzpirat/haml_coffee_assets) pour les projets utilisants Rails.
* [stitch-haml-coffee](https://github.com/jnbt/stitch-haml-coffee) pour les projets utilisants [Stitch](https://github.com/sstephenson/stitch).
* [guard-haml-coffee](https://github.com/ouvrages/guard-haml-coffee) pour les projets utilisants [Guard](https://github.com/guard/guard).
* [Haml Coffee compiler](https://raw.github.com/netzpirat/haml-coffee/master/dist/compiler/hamlcoffee.js)
  ([minified](https://raw.github.com/netzpirat/haml-coffee/master/dist/compiler/hamlcoffee.min.js))
  pour le navigateur.

Veuillez noter que cette dernière version (navigateur) n'inclue pas CoffeeScript, vous devrez vous assurer de l'avoir inclus avant d'inclure haml-coffee.

## Compilateur Haml Coffee

### Via l'API

Vous pouvez compiler un template Haml Coffee à une fonction JavaScript en lui passant les variables locales à utiliser pour générer le HTML.
Le code suivant

```coffeescript
hamlc = require 'haml-coffee'
tmpl = hamlc.compile '%h1= @title'
html = tmpl title: 'Haml Coffee rocks!'
```

donnera `<h1>Haml Coffee rocks!</h1>`.

La fonction `compile` peut prendre les options comme second paramètre pour personnaliser la fonction :

```coffeescript
hamlc.compile '%h1= @title'
  cleanValue: false
  escapeHtml: false
```

Référez-vous aux [options](#compiler-options) pour avoir des informations plus détaillées sur les options disponibles et n'hésitez pas à naviguer dans le [codo](https://github.com/netzpirat/codo) généré depuis l'[Haml-Coffee API documentation](http://coffeedoc.info/github/netzpirat/haml-coffee/master/).

### Avec Express

Vous pouvez configurer [Express](http://expressjs.com/) pour utiliser Haml Coffee comme moteur de template.

#### Express 3

Depuis la version 1.4.0, Haml Coffee supporte Express 3 et peut être enregistré comme moteur de thème comme il suit :

```coffeescript
express = require 'express'
app     = express()

app.engine 'hamlc', require('haml-coffee').__express
```

Vous pouvez aussi utiliser [consolidate.js](https://github.com/visionmedia/consolidate.js) pour l'inclure :

```coffeescript
express = require 'express'
cons    = require 'consolidate'
app     = express()

app.engine 'hamlc', cons['haml-coffee']
```

#### Express 2

Depuis la version 0.5.0, Haml Coffee supporte Express 2 et peut être enregistré comme moteur de thème comme il suit :

```coffeescript
express = require 'express'

app = express.createServer()
app.register '.hamlc', require('haml-coffee')
```

Vous pouvez aussi utiliser [consolidate.js](https://github.com/visionmedia/consolidate.js) pour l'inclure :

```coffeescript
express = require 'express'
cons    = require 'consolidate'

app = express.createServer()
app.register '.hamlc', cons['haml-coffee']
```

#### Utilisation avec Express

##### Agencements

Express 2 utilise un fichier d'agencement `layout.hamlc` par défaut, dans lequel vous pouvez insérer la vue de cette manière :

```haml
!!!
%head
  %title Application Express
%body
  != @body
```

Maintenant, vous pouvez créer une vue avec Haml Coffee

```haml
%h1= "Welcome #{ @name }"
%p You've rendered your first Haml Coffee view.
```

que vous pouvez exécuter comme ceci :

```coffeescript
app.get '/', (req, res) ->
  res.render 'index.hamlc', name: 'Express user'
```

Express 3 a retiré les agencements (layouts), mais vous pouvez installer
[express-partials](https://github.com/publicclass/express-partials) et le configurer comme middleware :

```
partials = require 'express-partials'
app.use partials()
```

##### Moteur de thème par défaut

Il est possible d'utiliser Haml Coffee comme moteur de template en modifiant l'option `view engine` :

```coffeescript
app.configure ->
  app.set 'view engine', 'hamlc'
```

Qui vous permet d'omettre l'extension `.hamlc` quand vous exécutez une vue :

```coffeescript
app.get '/', (req, res) ->
  res.render 'index', name: 'Express user'
```

##### Options compilateur

Avec Express 3, vous pouvez passer des options au compilateur en utilisant `app.locals`:

```
app.locals.uglify = true
```

qui équivaut à faire :

```
res.render view, { uglify: true }
```
Référez-vous aux [options](#compiler-options) pour avoir des informations plus détaillées sur les options disponibles.

### Via l'outil en ligne de commande

Après l'installation, vous aurez un fichier binaire `haml-coffee` que vous pourrez utiliser pour compiler des fichiers templates voire plusieurs fichiers templates dans un seul fichier JavaScript.

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

_La section suivante ne fait que décrire les options qui sont uniques à l'outil en ligne de commande._

Vous pouvez obtenir la liste des options en exécutant `haml-coffee --help` et vous référez aux [options](#compiler-options) pour avoir des informations plus détaillées sur les options disponibles

`input` et `output` sont optionnels et vous pouvez directement rediriger les flux (streams).

#### Nom du fichier d'entrée

Vous pouvez donner un fichier simple ou un nom de dossier avec l'option `-i`/`--input`.
Si vous passez un dossier, les fichier sont cherchés de manière récursive :

```bash
$ haml-coffee -i template.haml
```

Cette commande générera un fichier avec le même nom que celui donné mais avec `.jst` comme extension.
La commande ci-dessus par exemple produirait un fichier `template.jst`.

Un fichier Haml Coffee valide a l'une de ces extensions : `.haml`, `.html.haml`, `.hamlc` or
`.html.hamlc`.

#### Nom du fichier de sortie

Vous pouvez spécifier le fichier de sortie (unique) qui sera utilisé plutôt que laisser Haml Coffee le déduire via l'option `-o`/`--output` :

```bash
$ haml-coffee -i template.haml -o t.js
```

Cette commande générera un fichier nommé `t.js`. Vous pouvez aussi vus servir de cette commande et donner un dossier en entrée pour n'avoir qu'un fichier en sortie :

```bash
$ haml-coffee -i templates -o all.js
```

Cela compilera tous les fichiers templates dans le dossier `templates` dans un unique fichier `all.js`.

#### Espace de nom

Par défaut, chaque template est disponible dans `window.HAML` mais vous pouvez changer l'espace de nom avec l'option `-n`/`--namespace` :

```bash
$ haml-coffee -i template.haml -n exports.JST
```

#### Nom du template

Chaque template a un nom unique. Le nom est déduit depuis le fichier source en retirant l'extension et tous les caractères illégaux. Les noms des dossiers sont utilisés en plus de l'espace de nom. Par exemple, un template nommé `user/show-admin.html.haml` sera compilé dans une fonction accessible via `window.HAML['user/show_admin']`.

Via l'option `-b`/`--basename`, le nom déduit n'incluera pas le chemin vers le thème. Par exemple, un template nommé `user/show-admin.html.haml` sera compilé dans une fonction accessible via `window.HAML['show_admin']` au lieu de `window.HAML['user/show_admin']`.

L'option `-t`/`--template` vous permet de manuellement changer le nom du template :

```bash
$ haml-coffee -i template.haml -n exports.JST -t other
```

La fonction sera accessible via `exports.JST['other']`.

#### Extension de la portée (scope)

En étandant la portée (scope), vous pouvez accéder directement à vos variables locales sans utiliser `@` ou `this`:

```Haml
%h2= title
```

Ceci est possible grace au [with](https://developer.mozilla.org/en/JavaScript/Reference/Statements/with)
de JavaScript. Utiliser `with` est interdit en Mode Strict (ECMAScript 5).

#### Redirection de flux (streams)

Vous pouvez utiliser Haml Coffee en ligne de commande pour entrer un template et arrêtez via Ctrl+D :

```bash
$ haml-coffee -p amd
%h1 Hello AMD
^D
```

qui produira un module AMD dans la console. Vous devez utiliser le placement `amd` ou donner un nom au template comme par exemple

```bash
$ haml-coffee -t name
%p JST rocks!
^D
```

qui donnera le code source JST. Vous pouvez aussi rediriger les flux (streams) comme il suit :

```bash
$ haml-coffee -t name < input.hamlc > output.jst
```

## Support de Haml

Haml Coffee implémente la [Spécification Haml (EN)](https://github.com/haml/haml-spec) pour assurer un degré de compatibilité avec les autres implémentations HAML. Les sections suivantes sont parfaitement compatibles :

* Texte seul
* Multilignes : `|`
* Balises : `%`
* Attributs : `{}` or `()`
* Classes et ID : `.` et `#` (balise `div` implicite)
* Balises auto-fermantes : `/`
* Doctype  : `!!!`
* Commentaires HTML : `/`, commentaires conditionnels : `/[]`, commentaires Haml : `-#`
* Code CoffeeScript: `-`, insertion de CoffeeScript: `=`
* Interpolation : `#{}`
* Préservation d'espaces : `~`
* Suppression d'espaces : `>` et `<`
* Échappement `\`
* Échappement HTML : `&=`, dé-échappement HTML : `!=`
* Filtres : `:plain`, `:javascript`, `:css`, `:cdata`, `:escaped`, `:preserve`
* Conversion des attributs booléens
* Syntaxe de référencement d'objets : `[]`

Consultez la [Référence Haml (EN)](http://haml-lang.com/docs/yardoc/file.HAML_REFERENCE.html) pour plus de détails.

Haml Coffee supporte les attributs style Ruby 1.8 et Ruby 1.9. Les attributs (style Ruby 1.8)

```haml
%a{ :href => 'http://haml-lang.com/', :title => 'Haml home' } Haml
```

peuvent aussi être écrits comme il suit (style Ruby 1.9) :

```haml
%a{ href: 'http://haml-lang.com/', title: 'Haml home' } Haml
```

Le style HTML est aussi

```haml
%a( href='http://haml-lang.com/' title='Haml home') Haml
```

### Aides (helpers)

Haml Coffee supporte certain des fonctions incluses dans les [aides (EN)](http://haml-lang.com/docs/yardoc/Haml/Helpers.html) de Ruby Haml.
Les aides existantes gardent le contexte, il n'est pas nécessaire d'utiliser `=>`.

#### Surround ("entoure")

Entoure un block de Haml avec des chaînes, sans espaces entre.

```haml
!= surround '(', ')', ->
  %a{:href => "food"} chicken
```

produit

```html
(<a href='food'>chicken</a>)
```

#### Succeed ("succès")

Ajoute un bloc à la fin d'un bloc Haml, sans espace entre.

```haml
click
!= succeed '.', ->
  %a{:href=>"thing"} here
```

produit

```html
click
<a href='thing'>here</a>.
```

#### Precede ("précède")

Précède un bloc HAML d'une chaîne, sans espace entre.

```haml
!= precede '*', ->
  %span.small Not really
```

produit

```html
*<span class='small'>Not really</span>
```

### Syntaxe de référencement d'objets

Haml Coffee supporte le référencement d'objets, mais implémenté d'une manière différente à cause de la manière dont fonctionne CoffeeScript et du moteur.

Les crochets contiennent l'objet CoffeeScript object ou la classe qui sera utilisé pour la classe et l'ID.
La classe utilise le nom du constructeur de l'objet (transformé pour utiliser des underscores plutôt que du camelCase) et l'ID utilise le nom du constructor, suivi de la valeur de propriété `id` ou de la valeur de la fonction `#to_key` ou de la fonction `#id` (dans cet ordre).
Le second argument permet de spécifier un préfixe.

Par exemple :

```haml
%div[@user, 'greeting']
  Hello
```

produit

```html
<div class='greeting_user' id='greeting_user_15'>
  Hello!
</div>
```

Si vous avez besoin d'utiliser autre chose que le nom du constructeur, vous pouvez utiliser la fonction `#hamlObjectRef` sur l'objet :

```haml
:coffeescript
  class User
    id: 23
    hamlObjectRef: -> 'custom'

%div[new User()]
  Hello
```

produit

```html
<div class='custom' id='custom_23'>
  Hello!
</div>
```

### Directives

Haml Coffee supporte uniquement une directive qui étend la syntaxe Haml

### Include

Vous pouvez utiliser la directive `+include` pour inclure un autre fichier template :

```haml
%h1 Include
+include 'partials/test'
```

Cela cherchera le fichier template et l'incluera.
En imaginant `partials/test` contient

```haml
%p Partial content
```

Le résultat final sera

```html
<h1>Include</h1>
<p>Partial content</p>
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

* Name: `escapeHtml`
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

* 'standalone' <br />
  Returns the template function without wrapping it

* `amd` <br />
  Wraps the template function into a `define()` statement to allow async
  loading via AMD.

See AMD support for more information.

### Module dependencies

* Name: `dependencies`
* Type: `Object`
* Default: `{ hc: 'hamlcoffee' }`

The `dependencies` option allows you to define the modules that must be required for the AMD template `define` function.
The object key will be the function parameter name of the module the object value defines. See AMD support for more
information.

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
  * `customReference`: Creates the Haml object reference.

The `customSurround`, `customSucceed` and `customPrecede` are bound to the template context.

You can find a default implementation for all these helper functions in
[Haml Coffee Assets](https://github.com/netzpirat/haml_coffee_assets/blob/master/vendor/assets/javascripts/hamlcoffee.js.coffee.erb).

## AMD support

* Global dependencies
* Trivial dependency detection

Haml Coffee has built in AMD support by setting the `placement` option to `amd`. This will generate a module definition
for the JavaScript template. The `dependencies` options can be used to provide a mapping of module names to parameters.
To illustrate this, the default value will result in the following module declaration:

```CoffeeScript
define ['hamlcoffee'], (hc) ->
```

When the template contains a require call in the form of

```CoffeeScript
 - require 'module'
 - require 'deep/nested/other'
```

it will be added to the module definition list

```CoffeeScript
define ['hamlcoffee', 'module', 'deep/nested/other'], (hc, module, other) ->
```

allowing you to render a partial template:

```CoffeeScript
!= module()
!= other()
```

Of course the require call can have different quotes or parenthesises, allowing you to directly require and render:

```CoffeeScript
!= require("another/other")()
```

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

Copyright (c) 2011 9elements, 2011-2013 Michael Kessler

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
