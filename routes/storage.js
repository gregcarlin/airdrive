'use strict';

var express = require('express');
var router = new express.Router();

var core = require('./core');

// get the user's filesystem
router.get('/', function(req, res, next) {
  core.getDb(function(err, db) {
    if (err) {
      res.json({success: false});
      return next(err);
    }

    var filesystem = db.collection('filesystem');
    filesystem.findOne({userId: req.userId}, function(err, files) {
      db.close();
      if (err) {
        res.json({success: false});
        return next(err);
      }

      res.json({
        success: true,
        files: files.root
      });
    });
  });
});

// get specific file data
router.get('/file/:id', function(req, res, next) {
  core.storj.createFileStream('578e4b9d9e952c0b570690cc', req.params.id, function(err, stream) {
    if (err) {
      res.sendStatus(404);
      return next(err);
    }

    stream.pipe(res);
  });
});

module.exports = router;
