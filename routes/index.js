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
});

router.post('/signup', function(req, res) {
  // TODO handle signup
});

module.exports = router;
