'use strict';

const Devebot = require('devebot');
const Promise = Devebot.require('bluebird');
const lodash = Devebot.require('lodash');
const mongoose = require('mongoose');
const chores = require('./chores');

mongoose.Promise = Promise;

function Service(params) {
  params = params || {};

  let mongo_conf = params.connection_options || params;
  let connection_string = params.connection_string || params.url;
  if (!lodash.isString(connection_string) || lodash.isEmpty(connection_string)) {
    connection_string = chores.buildMongodbUrl(mongo_conf);
  }
  let connection = null;

  this.getConnection = function() {
    return (connection = connection || createConnection(this, { mongoURI: connection_string }));
  };

  this.disconnect = function() {
    let p = new Promise(function(resolved, rejected) {
      if (connection != null) {
        connection.close(function() {
          resolved();
        })
      } else {
        resolved();
      }
    });
    p = p.then(function() {
      return mongoose.disconnect();
    }, function() {
      return mongoose.disconnect();
    });
    return p;
  }

  this.getSchema = function() {
    return mongoose.Schema;
  };

  this.isModelAvailable = function(modelName) {
    return !lodash.isNull(this.retrieveModel(modelName));
  };

  this.retrieveModel = function(modelName) {
    if (this.getConnection().modelNames().indexOf(modelName) < 0) return null;
    return this.getConnection().model(modelName);
  };

  this.registerModel = function(modelName, modelObject, modelOptions) {
    if (this.getConnection().modelNames().indexOf(modelName) >= 0) {
      return this.getConnection().model(modelName);
    }
    var DocumentSchema = null;
    if (lodash.isFunction(modelObject)) {
      var modelCallback = modelObject;
      DocumentSchema = modelCallback(mongoose.Schema);
    } else if (lodash.isObject(modelObject) && !lodash.isArray(modelObject)) {
      DocumentSchema = new mongoose.Schema(modelObject, modelOptions);
    }
    return (DocumentSchema == null) ? null : this.getConnection().model(modelName, DocumentSchema);
  };

  this.getServiceInfo = function() {
    let conf = lodash.pick(mongo_conf, ['host', 'port', 'name', 'username', 'password']);
    lodash.assign(conf, { password: '***' });
    return {
      connection_info: conf,
      url: chores.buildMongodbUrl(conf),
      modelNames: this.getConnection().modelNames()
    };
  };
  
  this.getServiceHelp = function() {
    let info = this.getServiceInfo();
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
};

module.exports = Service;

function createConnection(self, params) {
  params = params || {};

  const LX = self.logger || chores.getLogger();
  const LT = self.tracer || chores.getTracer();

  var mongoURI = params.mongoURI;
  if (lodash.isEmpty(mongoURI)) return null;

  var connection = mongoose.createConnection(mongoURI);

  // When successfully connected
  connection.on('connected', function() {
    LX.has('debug') && LX.log('debug', 'Mongoose connected to [' + mongoURI + ']');
  });

  // When the connection is disconnected
  connection.on('disconnected', function() {
    LX.has('debug') && LX.log('debug', 'Mongoose disconnected from [' + mongoURI + ']');
  });

  // If the connection throws an error
  connection.on('error', function(err) {
    LX.has('debug') && LX.log('debug', 'Mongoose connection[' + mongoURI + '] error:' + err);
  });

  // If the Node process ends, close the Mongoose connection
  process.on('SIGINT', function() {
    connection.close(function () {
      LX.has('debug') && LX.log('debug', 'Mongoose connection[' + mongoURI + '] closed');
    });
  });

  return connection;
};
