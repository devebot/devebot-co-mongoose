'use strict';

var events = require('events');
var util = require('util');
var Devebot = require('devebot');
var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');

var Service = function(params) {
  params = params || {};

  var self = this;
  var LX = params.loggingFactory.getLogger();

  var exampleMongoHandler = params['application/mongoose#exampleMongoHandler'];
};

Service.referenceList = [
  'application/mongoose#exampleMongoHandler'
];

module.exports = Service;
