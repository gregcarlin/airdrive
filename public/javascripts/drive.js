'use strict';

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

$(function() {
  var fileData = {};
  var rawPath = '';
  var uploadCount = 0;

  // Load file data
  var getPath = function(structure) {
    rawPath = '';

    var hash = window.location.hash.trim();
    if (!hash) return '';

    var path = hash.substring(1);
    if (!path) return '';

    rawPath = path;
    return '["children"]["' + path.split('/').join('"]["children"]["') + '"]';
  };

  var addFile = function(data, name) {
    var html = '';
    html += '<div class="file';
    if (data.type === 'directory') html += ' folder';
    html += '">';
    var pathPrefix = rawPath ? (rawPath + '/') : '';
    html += '<a href="#' + pathPrefix + name + '">';
    html += '<span class="fa-stack fa-3x">';
    html += '<span class="fa fa-stack-2x fa-';
    html += icons[data.type][data.visibility];
    html += '"></span>';
    if (data.visibility === 'public') {
      html += '<span class="fa fa-globe fa-stack-1x"></span>';
    }
    html += '</span>';
    html += '<span class="desc">' + name + '</span>';
    html += '</a>';
    html += '</div>';
    $('.files').append(html);
  };

  window.onhashchange = function() {
    var path = getPath(fileData);
    var current = path ? _.property(path)(fileData) : fileData;

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
    } else {
      // TODO actually read file
      $('.files').html(current.data || '<em>This file is empty.</em>');
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
  var dropZone = $('.dropzone');

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

  var fileLoaded = function(file, progressElement) {
    return function(e) {
      // var data = e.target.result;
      // TODO actually upload file
      var intervalId = setInterval(function() {
        var progress = parseInt(progressElement.attr('aria-valuenow'), 10);
        if (progress >= 100) {
          // stop the interval
          clearInterval(intervalId);
          // remove this progress bar
          progressElement.parent().remove();

          // hide upload section if this is the last upload
          uploadCount -= 1;
          if (uploadCount <= 0) {
            $('.upload').hide();
          }

          // show file in browser
          addFile({
            type: 'file',
            visibility: 'private'
          }, file.name);
        } else {
          // randomly advance progress bar
          progress += 4 + parseInt(Math.random() * 4, 10);
          progressElement.attr('aria-valuenow', progress);
          progressElement.css('width', progress + '%');
          progressElement.html('<span class="sr-only">' + progress + '% Complete</span>');
        }
      }, 100);
    };
  };

  dropZone.on('drop', function(e) {
    e.preventDefault();
    dropZone.css('visibility', 'hidden');

    var files = e.originalEvent.dataTransfer.files;
    for (var i = 0; i < files.length; i++) {
      var progHtml = '<div class="progress-bar progress-bar-success progress-bar-striped active" role="progress-bar" aria-valuenow="0" aria-valuemin="0" area-valuemax="100">'
      + '<span class="sr-only">0% Complete</span>'
      + '</div>';
      var progElem = $(progHtml);
      var progWrapperHtml = '<div class="progress-wrapper"><span class="progress-name">'
      + files[i].name
      + '</span>'
      + '<a href="#"><span class="fa fa-times"></span></a>'
      + '</div>';
      var progWrapper = $(progWrapperHtml);
      progWrapper.prepend(progElem);
      $('.upload').append(progWrapper).show();
      uploadCount += 1;

      var fr = new FileReader();
      fr.onload = fileLoaded(files[i], progElem);
      fr.readAsDataURL(files[i]);
    }
  });

  // Set up droppables
  $('.drag-option').droppable({
    hoverClass: 'drop-hover'
  });
  $('.trash').on('drop', function(e, ui) {
    ui.draggable.remove();
    // TODO tell backend to delete file
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
});
