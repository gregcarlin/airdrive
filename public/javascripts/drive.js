$(function() {
  var fileData = {};
  var rawPath = '';

  // Load file data
  var getPath = function(structure) {
    rawPath = '';

    var hash = window.location.hash.trim();
    if (!hash) return '';

    var path = hash.substring(1);
    if (!path) return '';

    rawPath = path;
    return 'children.' + path.replace(new RegExp('/', 'g'), '.children.');
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
      if (index == crumbs.length - 1) {
        crumbHtml += '<li class="active">' + crumb + '</li>';
      } else {
        var link = _.join(_.take(_.tail(crumbs), index), '/');
        crumbHtml += '<li><a href="#' + link + '">' + crumb + '</a></li>';
      }
    });
    $('.breadcrumb').html(crumbHtml);

    if (current.type == 'directory') {
      var html = '';
      _.each(current.children, function(child, name) {
        html += '<div class="file';
        if (child.type == 'directory') html += ' folder';
        html += '">';
        var pathPrefix = rawPath ? (rawPath + '/') : '';
        html += '<a href="#' + pathPrefix + name + '">';
        html += '<span class="fa fa-4x fa-';
        html += child.type == 'directory' ? 'folder' : 'file-text';
        html += '"></span>';
        html += '<span class="desc">' + name + '</span>';
        html += '</a>';
        html += '</div>';
      });
      if (!html) {
        html = 'This folder is empty.';
      }
      $('.files').html(html);
    } else {
      // TODO file preview/download
    }

    // Set up drag and drops for files and folders
    $('.file').draggable({
      revert: true,
      containment: 'window'
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

  var fileLoaded = function(file) {
    return function(e) {
      var data = e.target.result;
      // TODO
    };
  };

  dropZone.on('drop', function(e) {
    e.preventDefault();
    dropZone.css('visibility', 'hidden');

    var files = e.originalEvent.dataTransfer.files;
    for (var i = 0; i < files.length; i++) {
      var fr = new FileReader();
      fr.onload = fileLoaded(files[i]);
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
    // TODO open share modal
    $('#shareModal').modal();
  });
  $('.folder').droppable({
    hoverClass: 'drop-hover',
    drop: function(event, ui) {
      // TODO put file in folder
    }
  });
});
