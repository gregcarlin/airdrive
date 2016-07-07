'use strict';

var express = require('express');
var router = new express.Router();

var core = require('./core');

// home page
router.get('/', function(req, res) {
  core.render('index', res);
});

module.exports = router;
