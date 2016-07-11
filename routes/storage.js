'use strict';

var express = require('express');
var router = new express.Router();

var files = {
  type: 'directory',
  children: {
    Products: {
      type: 'directory',
      children: {
        Prototype: {
          type: 'directory',
          children: {
            'Folder 1': {
              type: 'directory'
            },
            'Folder 2': {
              type: 'directory'
            },
            'Folder 3': {
              type: 'directory'
            },
            'Document 1': {
              type: 'file'
            },
            'Document 2': {
              type: 'file'
            },
            'Document 3': {
              type: 'file'
            }
          }
        }
      }
    }
  }
};

router.get('/', function(req, res) {
  // TODO get data for this user
  res.json(files);
});

module.exports = router;
