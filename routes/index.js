'use strict';

var express = require('express');
var router = new express.Router();
var bcrypt = require('bcrypt');
var crypto = require('crypto');

var core = require('./core');

// home page
router.get('/', function(req, res) {
  res.render('index');
});

router.post('/login', function(req, res) {
  var email = (req.body.email || '').trim();
  var pass = req.body.pass || '';
  if (!email || !pass) {
    // TODO failed login
    return;
  }

  core.getDb(function(err, db) {
    if (err) {
      // TODO
      return;
    }

    var users = db.collection('users');
    users.findOne({email: email}, function(err, user) {
      if (err) {
        // TODO
        db.close();
        return;
      }

      if (!user) {
        // TODO
        db.close();
        return;
      }

      bcrypt.compare(pass, user.password, function(err, result) {
        if (err) {
          // TODO
          db.close();
          return;
        }

        if (!result) {
          // TODO wrong password
          db.close();
          return;
        }

        crypto.randomBytes(64, function(err, buf) {
          if (err) {
            // TODO
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
              // TODO
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
  // TODO handle signout
  res.redirect('/');
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

module.exports = router;
