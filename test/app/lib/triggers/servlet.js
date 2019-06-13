'use strict';

const Devebot = require('devebot');
const Promise = Devebot.require('bluebird');
const lodash = Devebot.require('lodash');

function Servlet(params) {
  params = params || {};

  var exampleMongoHandler = params['application/mongoose#exampleMongoHandler'];

  this.start = function() {
    exampleMongoHandler.getConnection();
    return Promise.resolve();
  };

  this.stop = function() {
    return exampleMongoHandler.disconnect();
  };
};

Servlet.referenceList = [ "application/mongoose#exampleMongoHandler" ];

module.exports = Servlet;
