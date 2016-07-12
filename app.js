'use strict';

var express = require('express');
var path = require('path');
// var favicon = require('serve-favicon');
var bodyParser = require('body-parser');
var compression = require('compression');
// var minify = require('express-minify');

var index = require('./routes/index');
var storage = require('./routes/storage');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// app.use(favicon(path.join(__dirname, 'public/favicon.png')));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(compression());
// app.use(minify());
app.use(express.static(path.join(__dirname, 'public')));

// takes post variables success and error (in url query) and passes them to ejs for rendering
app.use(function(req, res, next) {
  if (req.query.error) res.locals.error = req.query.error;
  if (req.query.success) res.locals.success = req.query.success;
  next();
});

app.use('/', index);
app.use('/data', storage);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  if (err.jgCode && err.jgCode < 300) return; // user error, no need to report

  console.error(err);
  console.error(err.stack);
  if (!err.handled) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  }
});

module.exports = app;
