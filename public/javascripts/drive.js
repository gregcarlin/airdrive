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
    html += '<span class="desc">';
    html += name;
    html += '</span>';
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

  // sets the progress value for a given progress element
  var setProgress = function(progress, progressElement) {
    progressElement.attr('aria-valuenow', progress);
    progressElement.css('width', progress + '%');
    progressElement.html('<span class="sr-only">' + progress + '% Complete</span>');
  };

  // called on the progress callback of a js file read
  var fileProgress = function(file, progressElement) {
    return function(e) {
      var progress = e.loaded / e.total * 50;
      setProgress(progress, progressElement);
    };
  };

  // called when js finishes reading a file
  var fileLoaded = function(file, progressElement) {
    return function(e) {
      $.ajax({
        xhr: function() {
          var request = new window.XMLHttpRequest();
          request.upload.addEventListener('progress', function(evt) {
            if (evt.lengthComputable) {
              setProgress(evt.loaded / evt.total * 100, progressElement);
            }
          }, false);
          return request;
        },
        type: 'POST',
        url: '/drive/upload',
        data: {
          file: e.target.result,
          name: file.name
        },
        success: function(data) {
          console.log('uploaded', data);

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
        }
      });
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
      fr.onprogress = fileProgress(files[i], progElem);
      fr.onload = fileLoaded(files[i], progElem);
      fr.readAsText(files[i], 'UTF-8');
    }
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
