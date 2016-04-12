'use strict';

var events = require('events');
var util = require('util');

var mongoose = require('mongoose');

var Devebot = require('devebot');
var async = Devebot.require('async');
var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var debug = Devebot.require('debug');
var debuglog = debug('devebot:co:mongodb:mongooseBridge');

var chores = require('../utils/chores.js');

var noop = function() {};

var Service = function(params) {
  debuglog(' + constructor start ...');
  Service.super_.apply(this);
  
  params = params || {};
  
  var self = this;
  
  self.logger = self.logger || params.logger || { trace: noop, info: noop, debug: noop, warn: noop, error: noop };
  
  var tracking_code = params.tracking_code || (new Date()).toISOString();
  
  self.getTrackingCode = function() {
    return tracking_code;
  };
  
  var mongo_conf = params.connection_options || {};
  var mongo_connection_string = chores.buildMongodbUrl(mongo_conf);

  var connection = createConnection({ mongoURI: mongo_connection_string});

  self.getConnection = function() {
    return connection;
  };

  self.getSchema = function() {
    return mongoose.Schema;
  };

  self.isModelAvailable = function(modelName) {
    return !lodash.isNull(self.retrieveModel(modelName));
  };

  self.retrieveModel = function(modelName) {
    if (connection.modelNames().indexOf(modelName) < 0) return null;
    return connection.model(modelName);
  };

  self.registerModel = function(modelName, modelObject, modelOptions) {
    var DocumentSchema = new mongoose.Schema(modelObject, modelOptions);
    if (connection.modelNames().indexOf(modelName) >= 0) {
      return connection.model(modelName);
    }
    return connection.model(modelName, DocumentSchema);
  };

  self.getServiceInfo = function() {
    var conf = lodash.pick(mongo_conf, ['host', 'port', 'name', 'username', 'password']);
    lodash.assign(conf, { password: '***' });
    return {
      connection_info: conf,
      url: chores.buildMongodbUrl(conf),
      collection_defs: self.mongo_cols
    };
  };
  
  self.getServiceHelp = function() {
    var info = self.getServiceInfo();
    return [{
      type: 'record',
      title: 'MongoDB bridge',
      label: {
        connection_info: 'Connection options',
        url: 'URL',
        collection_defs: 'Collections'
      },
      data: {
        connection_info: JSON.stringify(info.connection_info, null, 2),
        url: info.url,
        collection_defs: JSON.stringify(info.collection_defs, null, 2)
      }
    }];
  };

  debuglog(' - constructor has finished');
};

Service.argumentSchema = {
  "id": "mongooseBridge",
  "type": "object",
  "properties": {
    "tracking_code": {
      "type": "string"
    },
    "connection_options": {
      "type": "object"
    }
  }
};

util.inherits(Service, events.EventEmitter);

module.exports = Service;

var createConnection = function(params) {
  params = params || {};

  var mongoURI = params.mongoURI;
  if (lodash.isEmpty(mongoURI)) return null;

  var connection = mongoose.createConnection(mongoURI);

  // When successfully connected
  connection.on('connected', function() {
    debuglog('Mongoose connected to [' + mongoURI + ']');
  });

  // When the connection is disconnected
  connection.on('disconnected', function() {
    debuglog('Mongoose disconnected from [' + mongoURI + ']');
  });

  // If the connection throws an error
  connection.on('error', function(err) {
    debuglog('Mongoose connection[' + mongoURI + '] error:' + err);
  });

  // If the Node process ends, close the Mongoose connection
  process.on('SIGINT', function() {
    connection.close(function () {
      debuglog('Mongoose connection[' + mongoURI + '] closed & app exit');
      process.exit(0);
    });
  });

  return connection;
};
