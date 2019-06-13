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

process.on('SIGINT', function() {
  app.server.stop().then(function () {
    console.log("The server has been stopped.");
  });
});

module.exports = app;
