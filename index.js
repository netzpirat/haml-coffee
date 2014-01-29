CoffeeScript = require('coffee-script');

if (typeof(CoffeeScript.register) == 'function') {
  CoffeeScript.register();
}

module.exports = require('./src/hamlc');
