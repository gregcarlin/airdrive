'use strict';

var express = require('express');
var router = new express.Router();

var core = require('./core');
var bucket = core.config.master_bucket;

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
  core.storj.createFileStream(bucket, req.params.id, function(err, stream) {
    if (err) {
      res.sendStatus(404);
      return next(err);
    }

    stream.pipe(res);
  });
});

module.exports = router;
