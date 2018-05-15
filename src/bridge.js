'use strict';

var Devebot = require('devebot');
var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var debugx = Devebot.require('pinbug')('devebot:co:mongoose:bridge');
var mongoose = require('mongoose');
var chores = require('./chores');

var noop = function() {};

var Service = function(params) {
  debugx(' + constructor start ...');
  
  params = params || {};
  
  var self = this;
  var LX = this.logger || chores.getLogger();
  var LT = this.tracer || chores.getTracer();

  var mongo_conf = params.connection_options || {};
  var mongo_connection_string = chores.buildMongodbUrl(mongo_conf);
  var connection = null;

  self.getConnection = function() {
    return (connection = connection || createConnection({ mongoURI: mongo_connection_string}));
  };

  self.getSchema = function() {
    return mongoose.Schema;
  };

  self.isModelAvailable = function(modelName) {
    return !lodash.isNull(self.retrieveModel(modelName));
  };

  self.retrieveModel = function(modelName) {
    if (self.getConnection().modelNames().indexOf(modelName) < 0) return null;
    return self.getConnection().model(modelName);
  };

  self.registerModel = function(modelName, modelObject, modelOptions) {
    if (self.getConnection().modelNames().indexOf(modelName) >= 0) {
      return self.getConnection().model(modelName);
    }
    var DocumentSchema = null;
    if (lodash.isFunction(modelObject)) {
      var modelCallback = modelObject;
      DocumentSchema = modelCallback(mongoose.Schema);
    } else if (lodash.isObject(modelObject) && !lodash.isArray(modelObject)) {
      DocumentSchema = new mongoose.Schema(modelObject, modelOptions);
    }
    return (DocumentSchema == null) ? null : self.getConnection().model(modelName, DocumentSchema);
  };

  self.getServiceInfo = function() {
    var conf = lodash.pick(mongo_conf, ['host', 'port', 'name', 'username', 'password']);
    lodash.assign(conf, { password: '***' });
    return {
      connection_info: conf,
      url: chores.buildMongodbUrl(conf),
      modelNames: self.getConnection().modelNames()
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
        modelNames: 'Models'
      },
      data: {
        connection_info: JSON.stringify(info.connection_info, null, 2),
        url: info.url,
        modelNames: JSON.stringify(info.modelNames, null, 2)
      }
    }];
  };

  debugx(' - constructor has finished');
};

module.exports = Service;

var createConnection = function(params) {
  params = params || {};

  var mongoURI = params.mongoURI;
  if (lodash.isEmpty(mongoURI)) return null;

  var connection = mongoose.createConnection(mongoURI);

  // When successfully connected
  connection.on('connected', function() {
    debugx('Mongoose connected to [' + mongoURI + ']');
  });

  // When the connection is disconnected
  connection.on('disconnected', function() {
    debugx('Mongoose disconnected from [' + mongoURI + ']');
  });

  // If the connection throws an error
  connection.on('error', function(err) {
    debugx('Mongoose connection[' + mongoURI + '] error:' + err);
  });

  // If the Node process ends, close the Mongoose connection
  process.on('SIGINT', function() {
    connection.close(function () {
      debugx('Mongoose connection[' + mongoURI + '] closed & app exit');
      process.exit(0);
    });
  });

  return connection;
};
