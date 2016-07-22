'use strict';

// gets password from local storage
// if absent, requests from user
var getPass = function() {
  if (localStorage.password) return localStorage.password;

  var newPass = prompt('Please re-enter your password');
  localStorage.password = newPass;
  return newPass;
};
var pass2key = function(pass) {
  // TODO use a salt?
  // eslint-disable-next-line new-cap
  return CryptoJS.PBKDF2(pass, '', {keySize: 256 / 32});
};
var iv = CryptoJS.enc.Hex.parse('TODO better iv');

// font awesome icon ids
var icons = {
  directory: {
    private: 'folder',
    public: 'folder-o'
  },
  file: {
    private: 'file-text',
    public: 'file-o'
  }
};

// http://stackoverflow.com/a/21797381/720889
var _base64ToArrayBuffer = function(base64) {
  var binaryString = window.atob(base64);
  var len = binaryString.length;
  var bytes = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

$(function() {
  var fileData = {};
  var rawPath = '';
  var uploadCount = 0;

  // Load file data
  var getPath = function() {
    rawPath = '';

    var hash = window.location.hash.trim();
    if (!hash) return '';

    var path = hash.substring(1);
    if (!path) return '';

    return path;
  };
  var getAtPath = function(structure, fullPath) {
    var traverse = function(path, struct) {
      if (path.length === 0) return struct;

      var next = _.find(struct.children, function(child) {
        return child.name === path[0];
      });
      // TODO not found message?
      if (!next) return struct;

      return traverse(_.tail(path), next);
    };

    rawPath = fullPath;
    return traverse(fullPath.split('/'), structure);
  };

  var addFile = function(data) {
    var html = '';
    html += '<div class="file';
    if (data.type === 'directory') html += ' folder';
    html += '">';
    var pathPrefix = rawPath ? (rawPath + '/') : '';
    html += '<a href="#' + pathPrefix + data.name + '">';
    html += '<span class="fa-stack fa-3x">';
    html += '<span class="fa fa-stack-2x fa-';
    html += icons[data.type][data.visibility];
    html += '"></span>';
    if (data.visibility === 'public') {
      html += '<span class="fa fa-globe fa-stack-1x"></span>';
    }
    html += '</span>';
    html += '<span class="desc">';
    html += data.name;
    html += '</span>';
    html += '</a>';
    html += '</div>';
    $('.files').append(html);
  };

  window.onhashchange = function() {
    var path = getPath();
    var current = getAtPath(fileData, path);

    var crumbs = rawPath.split('/');
    crumbs.unshift('airDrive');
    crumbs = _.filter(crumbs, function(crumb) {
      return crumb;
    });
    var crumbHtml = '';
    _.each(crumbs, function(crumb, index) {
      if (index === crumbs.length - 1) {
        crumbHtml += '<li class="active">' + crumb + '</li>';
      } else {
        var link = _.join(_.take(_.tail(crumbs), index), '/');
        crumbHtml += '<li><a href="#' + link + '">' + crumb + '</a></li>';
      }
    });
    $('.breadcrumb').html(crumbHtml);

    if (current.type === 'directory') {
      if (!current.children || current.children.length <= 0) {
        $('.files').html('<em>This folder is empty.</em>');
      } else {
        $('.files').html('');
        _.each(current.children, addFile);
      }
    } else if (current.status === 'uploading') {
      $('.files').html('<em>This file is still being uploaded to the network.</em>');
    } else {
      $('.files').html('<em>Loading...</em>');
      var xhr = new XMLHttpRequest();
      xhr.open('GET', '/data/file/' + current.storjId, true);
      xhr.responseType = 'blob';
      xhr.onload = function(e) {
        var fileReader = new FileReader();
        fileReader.onload = function() {
          var encWordArr = CryptoJS.lib.WordArray.create(this.result);
          var encWordArrStr = encWordArr.toString(CryptoJS.enc.Base64);
          var decrypted = CryptoJS.AES.decrypt(encWordArrStr, pass2key(getPass()), {iv: iv});
          var newBuf = _base64ToArrayBuffer(decrypted.toString(CryptoJS.enc.Base64));

          var blob = new Blob([newBuf]);
          saveAs(blob, current.name);
        };
        fileReader.readAsArrayBuffer(this.response);
      };
      xhr.send();
    }

    // Set up drag and drops for files and folders
    $('.file').draggable({
      revert: true,
      containment: 'window'
    });
    $('.folder').droppable({
      hoverClass: 'drop-hover',
      drop: function(event, ui) {
        // TODO put file in folder
        ui.draggable.remove();
      }
    });
  };

  $.get('/data', function(data) {
    fileData = data;
    window.onhashchange();
  });

  // Set up full-page drag and drop file upload
  var dropZone = $('#dropzone');

  window.addEventListener('dragenter', function(e) {
    dropZone.css('visibility', 'visible');
  });

  var allowDrag = function(e) {
    e.originalEvent.dataTransfer.dropEffect = 'copy';
    e.preventDefault();
  };
  dropZone.on('dragenter', allowDrag);
  dropZone.on('dragover', allowDrag);

  dropZone.on('dragleave', function(e) {
    dropZone.css('visibility', 'hidden');
  });

  // sets the progress value for a given progress element
  var setProgress = function(progress, fileId) {
    var progressElement = $('.progress-bar[data-uuid="' + fileId + '"]');
    progressElement.attr('aria-valuenow', progress);
    progressElement.css('width', progress + '%');
    progressElement.html('<span class="sr-only">' + progress + '% Complete</span>');
  };

  var r = new Resumable({
    target: '/drive/upload',
    testChunks: false
  });
  if (!r.support) {
    alert('File uploads are not supported with this browser, please upgrade.');
    return;
  }
  r.assignDrop(document.getElementById('dropzone'));

  dropZone.on('drop', function(e) {
    e.preventDefault();
    dropZone.css('visibility', 'hidden');
  });

  r.on('fileAdded', function(file) {
    var progHtml = '<div class="progress-bar progress-bar-success progress-bar-striped active" role="progress-bar" aria-valuenow="0" aria-valuemin="0" area-valuemax="100" data-uuid="' + file.uniqueIdentifier + '">'
    + '<span class="sr-only">0% Complete</span>'
    + '</div>';
    var progElem = $(progHtml);
    var progWrapperHtml = '<div class="progress-wrapper"><span class="progress-name">'
    + file.fileName
    + '</span>'
    + '<a href="#"><span class="fa fa-times"></span></a>'
    + '</div>';
    var progWrapper = $(progWrapperHtml);
    progWrapper.prepend(progElem);
    $('.upload').append(progWrapper).show();
    uploadCount += 1;

    var reader = new FileReader();
    reader.onload = function() {
      var wordArray = CryptoJS.lib.WordArray.create(reader.result);
      var encrypted = CryptoJS.AES.encrypt(wordArray, pass2key(getPass()), {iv: iv});
      var encBuf = _base64ToArrayBuffer(encrypted.ciphertext.toString(CryptoJS.enc.Base64));

      var file2 = new File([encBuf], file.file.name, {
        lastModified: file.file.lastModified,
        type: file.file.type
      });
      file.file = file2;

      r.upload();
    };
    reader.readAsArrayBuffer(file.file);
  });

  r.on('fileProgress', function(file) {
    setProgress(file.progress() * 100, file.uniqueIdentifier);
  });

  r.on('fileSuccess', function(file) {
    // remove this progress bar
    $('.progress-bar[data-uuid="' + file.uniqueIdentifier + '"]')
      .parent().remove();

    // hide upload section if this is the last upload
    uploadCount -= 1;
    if (uploadCount <= 0) {
      $('.upload').hide();
    }

    var fileObj = {
      name: file.fileName,
      type: 'file',
      visibility: 'private'
    };

    // show file in browser
    addFile(fileObj);

    var current = getAtPath(fileData, getPath());
    if (current.type === 'directory') {
      if (!current.children) current.children = [];
      current.children.push(fileObj);
    } else {
      // TODO put file data in parent of current
    }
  });

  r.on('fileError', function(file) {
    console.log('error', file);
    alert('There was an issue uploading your file.'
          + ' Please refresh the page and try again.');
  });

  // Set up droppables
  $('.drag-option').droppable({
    hoverClass: 'drop-hover'
  });
  $('.share').on('drop', function(e, ui) {
    $('#shareModal').modal('show');
    $('#shareModal button[type="submit"]').unbind('click').click(function(e) {
      e.preventDefault();
      // TODO tell backend to share file

      var stack = ui.draggable.find('.fa-stack');
      var icons = stack.children();
      // if not already public/shared
      if (icons.length < 2) {
        var icon = icons.first();
        if (icon.hasClass('fa-folder')) {
          icon.removeClass('fa-folder');
          icon.addClass('fa-folder-o');
        } else {
          icon.removeClass('fa-file-text');
          icon.addClass('fa-file-o');
        }
        stack.append('<span class="fa fa-globe fa-stack-1x"></span>');
      }

      $('#shareModal').modal('hide');
    });
  });
  $('.rename').on('drop', function(e, ui) {
    $('#renameModal input').val(ui.draggable.find('.desc').html());
    $('#renameModal').modal('show');
    $('#renameModal button[type="submit"]').unbind('click').click(function(e) {
      e.preventDefault();

      // TODO tell backend to rename folder
      var name = $('#renameModal input').val();
      ui.draggable.find('.desc').html(name);

      $('#renameModal').modal('hide');
    });
  });
  $('.trash').on('drop', function(e, ui) {
    ui.draggable.remove();
    // TODO tell backend to delete file
  });
});
