'use strict';

var express = require('express');
var router = new express.Router();

var files = {
  type: 'directory',
  visibility: 'private',
  children: {
    Products: {
      type: 'directory',
      visibility: 'private',
      children: {
        Prototype: {
          type: 'directory',
          visibility: 'private',
          children: {
            'Folder 1': {
              type: 'directory',
              visibility: 'private'
            },
            'Folder 2': {
              type: 'directory',
              visibility: 'public'
            },
            'Folder 3': {
              type: 'directory',
              visibility: 'private'
            },
            'Document 1': {
              type: 'file',
              visibility: 'public'
            },
            'Document 2': {
              type: 'file',
              visibility: 'private'
            },
            'Document 3': {
              type: 'file',
              visibility: 'private'
            }
          }
        }
      }
    },
    Documents: {
      type: 'directory',
      visibility: 'private'
    },
    Photos: {
      type: 'directory',
      visibility: 'public'
    },
    Videos: {
      type: 'directory',
      visibility: 'private'
    }
  }
};

router.get('/', function(req, res) {
  // TODO get data for this user
  res.json(files);
});

module.exports = router;
