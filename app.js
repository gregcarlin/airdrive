'use strict';

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var multipart = require('connect-multiparty');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var compression = require('compression');
// var minify = require('express-minify');

var core = require('./routes/core');
var index = require('./routes/index');
var storage = require('./routes/storage'); // api-like direct data stuff
var drive = require('./routes/drive'); // ui stuff

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(favicon(path.join(__dirname, 'public/favicon.png')));
app.use(multipart());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(compression());
// app.use(minify());
app.use(express.static(path.join(__dirname, 'public')));

// takes post variables success and error (in url query) and passes them to ejs for rendering
app.use(function(req, res, next) {
  if (req.query.error) res.locals.error = req.query.error;
  if (req.query.success) res.locals.success = req.query.success;
  next();
});

// should be used in routes where authentication is required
var auth = function(req, res, next) {
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
};

app.use('/', index);
app.use('/data', auth, storage);
app.use('/drive', auth, drive);

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
  if (err.handle) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  }
});

module.exports = app;
