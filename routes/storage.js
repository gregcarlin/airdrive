'use strict';

var express = require('express');
var router = new express.Router();

var core = require('./core');

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

module.exports = router;
