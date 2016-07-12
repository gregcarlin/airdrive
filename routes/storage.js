'use strict';

var express = require('express');
var router = new express.Router();
var fs = require('fs');

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
            'Document 2.txt': {
              type: 'file',
              visibility: 'private',
              data: 'Hello world'
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
      visibility: 'public',
      children: {
        'picture.jpg': {
          type: 'file',
          visibility: 'public',
          data: ('<img src="data:image/png;base64,' + new Buffer(fs.readFileSync('routes/Lenna.png')).toString('base64') + '" />')
        }
      }
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
