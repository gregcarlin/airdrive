'use strict';

var express = require('express');
var _ = require('lodash');
var mongoClient = require('mongodb').MongoClient;
var storj = require('storj');

var config = require('../configuration.json');

/*
 * Used to convert irregularly specified css and js data into a
 * consistent format.
 */
var homogenize = function(data) {
  if (!data) return [];

  if (!Array.isArray(data)) data = [data];
  for (var i = 0; i < data.length; i++) {
    if (data[i].url) {
      data[i] = {
        url: data[i].url,
        special: (' ' + data[i].special + ' ')
      };
    } else {
      data[i] = {
        url: data[i],
        special: ''
      };
    }
  }
  return data;
};

/*
 * Renders a page within the generic template.
 */
module.exports.render = function(page, res, vars) {
  vars = vars || {};
  _.merge(vars, res.locals);
  express().render(page + '.ejs', vars, function(err, html) {
    if (err) {
      console.log(err);
      return;
    }

    vars.page = page;
    vars.content = html;

    vars.css = homogenize(vars.css);
    vars.js = homogenize(vars.js);

    res.render('template', vars);
  });
};

module.exports.getDb = function(callback) {
  mongoClient.connect('mongodb://' + config.database.host + ':' + config.database.port + '/' + config.database.name, callback);
};

module.exports.storj = new storj.BridgeClient('https://api.storj.io', {
  keypair: new storj.KeyPair('47f2203fb54ef02815e954d732ba2d67f81f4bb4a9543b24b483fb0b68843972'),
  logger: {
    debug: console.log,
    warn: console.log,
    info: console.log,
    error: console.log
  },
  concurrency: 8,
  basicauth: {
    email: 'team@hyperfeit.com',
    password: 'airdrive'
  }
});
