'use strict';

var express = require('express');
var router = new express.Router();

var core = require('./core');

// home page
router.get('/', function(req, res) {
  res.render('index');
});

router.post('/login', function(req, res) {
  // TODO handle login
  res.redirect('/drive');
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
  res.render('drive');
});

module.exports = router;
