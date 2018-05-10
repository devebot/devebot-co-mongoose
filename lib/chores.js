'use strict';

var lodash = Devebot.require('lodash');
var logolite = Devebot.require('logolite');
var util = require('util');

var utils = {};

utils.buildMongodbUrl = function(host, port, name, username, password, authSource) {
  if (lodash.isObject(host)) {
    var mongodb_conf = host;
    host = mongodb_conf.host;
    port = mongodb_conf.port;
    name = mongodb_conf.name;
    username = mongodb_conf.username;
    password = mongodb_conf.password;
    authSource = mongodb_conf.authSource;
  }
  
  var mongodb_auth = [];
  if (lodash.isString(username) && username.length > 0) {
    mongodb_auth.push(username);
    if (lodash.isString(password)) {
      mongodb_auth.push(':', password, '@');
    }
  }
  mongodb_auth = mongodb_auth.join('');
  
  var url = util.format('mongodb://%s%s:%s/%s', mongodb_auth, host, port, name);
  
  if (authSource) {
    url = [url, '?authSource=', authSource].join('');
  }
  
  return url;
};

utils.getLogger = function () {
  return logolite.LogAdapter.getLogger();
};

utils.getTracer = function () {
  return logolite.LogTracer.ROOT;
};

module.exports = utils;
