'use strict';

var express = require('express');
var router = new express.Router();

var core = require('./core');

// get the user's filesystem
router.get('/', function(req, res) {
  core.getDb(function(err, db) {
    if (err) {
      // TODO
      return;
    }

    var filesystem = db.collection('filesystem');
    filesystem.findOne({userId: req.userId}, function(err, files) {
      db.close();
      if (err) {
        // TODO
        return;
      }

      res.json(files.root);
    });
  });
});

// get specific file data
router.get('/file/:id', function(req, res) {
  core.storj.createToken('5787efd4e7caec094411af9b', 'PULL', function(err, token) {
    if (err) {
      // TODO
      return;
    }

    console.log('token', token);
    console.log('fileId', req.params.id);
    core.storj.getFilePointer('5787efd4e7caec094411af9b', token.token, req.params.id, function(err, data) {
      if (err) {
        // TODO
        return;
      }

      console.log('data', data);
      console.log('data[0]', data[0]);
    });
  });
});

module.exports = router;
