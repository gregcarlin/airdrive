'use strict';

var express = require('express');
var router = new express.Router();
var fs = require('fs');
var path = require('path');
var _ = require('lodash');

var core = require('./core');
var config = core.config;
var resumable = require('./resumable-node')(config.temporary_directory);

router.get('/', function(req, res) {
  res.render('drive');
});

router.post('/upload', function(req, res, next) {
  resumable.post(req, function(status, filename, originalFilename, identifier) {
    if (status === 'done') {
      core.getDb(function(err, db) {
        if (err) {
          err.handle = true;
          return next(err);
        }

        var filesystem = db.collection('filesystem');
        filesystem.findOne({userId: req.userId}, function(err, files) {
          if (err) {
            db.close();
            err.handle = true;
            return next(err);
          }

          // TODO put file in correct directory
          files.root.children.push({
            name: filename,
            type: 'file',
            visibility: 'private',
            status: 'uploading'
          });
          filesystem.updateOne({userId: req.userId}, {$set: {root: files.root}}, {upsert: false}, function(err) {
            db.close();
            if (err) {
              err.handle = true;
              return next(err);
            }

            // nothing else to do
          });
        });
      });

      var filePath = path.join(config.temporary_directory, filename);
      resumable.write(identifier, fs.createWriteStream(filePath), {
        onDone: function() {
          core.storj.createToken('578e4b9d9e952c0b570690cc', 'PUSH', function(err, token) {
            if (err) {
              err.handle = true;
              return next(err);
            }

            core.storj.storeFileInBucket('578e4b9d9e952c0b570690cc', token.token, filePath, function(err, data) {
              if (err) {
                // TODO retry storj upload
                err.handle = true;
                return next(err);
              }

              if (!data) {
                // TODO retry storj upload
                return;
              }

              core.getDb(function(err, db) {
                if (err) {
                  err.handle = true;
                  return next(err);
                }

                var filesystem = db.collection('filesystem');
                filesystem.findOne({userId: req.userId}, function(err, files) {
                  if (err) {
                    db.close();
                    err.handle = true;
                    return next(err);
                  }

                  // TODO put file in correct directory
                  var file = _.find(files.root.children, _.matchesProperty('name', filename));
                  file.status = 'uploaded';
                  file.storjId = data.id;

                  filesystem.updateOne({userId: req.userId}, {$set: {root: files.root}}, {upsert: false}, function(err) {
                    db.close();
                    if (err) {
                      err.handle = true;
                      return next(err);
                    }

                    // TODO update client with storj id
                  });
                });
              });
            });
          });
        }
      });
    }
    res.send(status);
  });
});

module.exports = router;
