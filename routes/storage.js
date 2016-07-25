'use strict';

var express = require('express');
var router = new express.Router();
var _ = require('lodash');

var core = require('./core');
var bucket = core.config.master_bucket;
var fileHelper = require('../controllers/filesystem');

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

// move a file or folder
router.post('/move/', function(req, res, next) {
  core.getDb(function(err, db) {
    if (err) {
      res.json({success: false});
      return next(err);
    }

    var filesystem = db.collection('filesystem');
    filesystem.findOne({userId: req.userId}, function(err, files) {
      if (err) {
        res.json({success: false});
        return next(err);
      }

      var toMove = fileHelper.deleteAtPath(files.root, req.body.from);
      var folder = fileHelper.getAtPath(files.root, req.body.to);
      if (folder.type !== 'directory') {
        res.json({success: false});
        return;
      }

      if (_.some(folder, _.matchesProperty('name', toMove.name))) {
        res.json({
          success: false,
          message: 'That folder already contains a file with that name.'
        });
        return;
      }

      if (!folder.children) folder.children = [];
      folder.children.push(toMove);

      filesystem.updateOne({
        userId: req.userId
      }, {
        $set: {
          root: files.root
        }
      }, {
        upsert: false
      }, function(err) {
        if (err) {
          res.json({success: false});
          return next(err);
        }

        res.json({success: true});
      });
    });
  });
});

module.exports = router;
