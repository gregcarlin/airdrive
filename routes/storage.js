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
  core.storj.createFileStream('578e4b9d9e952c0b570690cc', req.params.id, function(err, stream) {
    if (err) {
      // TODO
      return;
    }

    stream.pipe(res);
  });
});

module.exports = router;
