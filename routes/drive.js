'use strict';

var express = require('express');
var router = new express.Router();
var fs = require('fs');
var path = require('path');

var core = require('./core');
var config = core.config;
var resumable = require('./resumable-node')(config.temporary_directory);

router.use(function(req, res, next) {
  core.getDb(function(err, db) {
    if (err) return next(err);

    var sessions = db.collection('sessions');
    sessions.findOne({hash: req.cookies.hash}, function(err, session) {
      if (err) {
        db.close();
        return next(err);
      }

      if (!session) {
        db.close();
        res.redirect('/');
        return;
      }

      req.userId = session.userId;
      db.close();
      next();
    });
  });
});

router.get('/', function(req, res) {
  core.getDb(function(err, db) {
    if (err) {
      // TODO
      return;
    }

    var users = db.collection('users');
    users.findOne({_id: req.userId}, function(err, user) {
      db.close();

      if (err) {
        // TODO
        return;
      }

      if (!user) {
        // TODO
        return;
      }

      // TODO load user-specific data
      res.render('drive');
    });
  });
});

router.post('/upload', function(req, res) {
  resumable.post(req, function(status, filename, originalFilename, identifier) {
    if (status === 'done') {
      var filePath = path.join(config.temporary_directory, filename);
      resumable.write(identifier, fs.createWriteStream(filePath), {
        onDone: function() {
          core.storj.createToken('5787efd4e7caec094411af9b', 'PUSH', function(err, token) {
            if (err) {
              // TODO handle
              return;
            }

            core.storj.storeFileInBucket('5787efd4e7caec094411af9b', token.token, filePath, function(err, data) {
              if (err) {
                // TODO handle
                return;
              }

              // TODO stuff
              console.log('data', data);
            });
          });
        }
      });
    }
    res.send(status);
  });
});

module.exports = router;
