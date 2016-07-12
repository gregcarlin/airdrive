'use strict';

var express = require('express');
var router = new express.Router();

// home page
router.get('/', function(req, res) {
  res.render('index');
});

router.post('/login', function(req, res) {
  // TODO handle login
  res.redirect('/drive');
});

router.post('/signup', function(req, res) {
  // TODO handle signup
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
