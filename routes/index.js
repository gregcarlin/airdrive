'use strict';

var express = require('express');
var router = new express.Router();
var bcrypt = require('bcrypt');
var crypto = require('crypto');

var core = require('./core');
var resumable = require('./resumable-node')('tmp/');

// home page
router.get('/', function(req, res) {
  res.render('index');
});

// login page
router.get('/login', function(req, res) {
  res.render('login');
});

router.post('/login', function(req, res) {
  var email = (req.body.email || '').trim();
  var pass = req.body.pass || '';
  if (!email || !pass) {
    res.render('login', {error: 'You must submit both an email and a password.'});
    return;
  }

  core.getDb(function(err, db) {
    if (err) {
      res.render('login', {error: 'An unexpected error has occurred.'});
      return;
    }

    var users = db.collection('users');
    users.findOne({email: email}, function(err, user) {
      if (err) {
        res.render('login', {error: 'An unexpected error has occurred.'});
        db.close();
        return;
      }

      if (!user) {
        res.render('login', {error: 'An account with that email does not yet exist.'});
        db.close();
        return;
      }

      bcrypt.compare(pass, user.password, function(err, result) {
        if (err) {
          res.render('login', {error: 'An unexpected error has occurred.'});
          db.close();
          return;
        }

        if (!result) {
          res.render('login', {error: 'That password is incorrect.'});
          db.close();
          return;
        }

        crypto.randomBytes(64, function(err, buf) {
          if (err) {
            res.render('login', {error: 'An unexpected error has occurred.'});
            db.close();
          }

          var hash = buf.toString('hex');
          var sessions = db.collection('sessions');
          sessions.insertOne({
            userId: user._id,
            hash: hash
          }, function(err) {
            db.close();
            if (err) {
              res.render('login', {error: 'An unexpected error has occurred.'});
              return;
            }

            res.cookie('hash', hash);
            res.redirect('/drive');
          });
        });
      });
    });
  });
});

router.post('/signup', function(req, res) {
  var email = (req.body.email || '').trim();
  if (!req.body.email) {
    res.json({
      success: false,
      message: 'You must enter an email address'
    });
    return;
  }

  core.getDb(function(err, db) {
    if (err) {
      res.json({
        success: false,
        message: 'An unknown error has occurred'
      });
      return;
    }

    var converts = db.collection('converts');
    converts.insertOne({
      email: email
    }, function(err, result) {
      if (err) {
        res.json({
          success: false,
          message: 'An unknown error has occurred'
        });
        db.close();
        return;
      }

      res.json({
        success: true
      });
      db.close();
    });
  });
});

router.get('/signout', function(req, res) {
  res.clearCookie('hash');
  core.getDb(function(err, db) {
    if (err) {
      console.log(err);
      res.redirect('/');
      return;
    }

    var sessions = db.collection('sessions');
    sessions.removeOne({hash: req.cookies.hash}, function(err) {
      if (err) console.log(err);

      res.redirect('/');
    });
  });
});

router.get('/drive', function(req, res) {
  // TODO authenticate user, load user-specific details
  core.getDb(function(err, db) {
    if (err) {
      // TODO
      return;
    }

    var sessions = db.collection('sessions');
    sessions.findOne({hash: req.cookies.hash}, function(err, session) {
      if (err) {
        // TODO
        db.close();
        return;
      }

      if (!session) {
        // TODO
        db.close();
        return;
      }

      var users = db.collection('users');
      users.findOne({_id: session.userId}, function(err, user) {
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
});

router.post('/drive/upload', function(req, res) {
  resumable.post(req, function(status, filename, originalFilename, identifier) {
    if (status === 'done') {
      // TODO send to storj
      core.storj.createBucket({
        storage: 10,
        transfer: 30,
        name: 'Test bucket'
      }, function(err) {
        console.log(err);
      });
    }
    res.send(status);
  });
});

module.exports = router;
