'use strict';

var app = require('devebot').launchApplication({
  appRootPath: __dirname
}, [], [
  {
    name: 'devebot-co-mongoose',
    path: require('path').join(__dirname, '../../index.js')
  }
]);

if (require.main === module) app.server.start();

module.exports = app;
