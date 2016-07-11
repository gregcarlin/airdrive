$(function() {
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


  // Set up drag and drops for files and folders
  $('.file').draggable({
    revert: true,
    containment: 'window'
  });

  $('.drag-option').droppable({
    hoverClass: 'drop-hover',
    drop: function(event, ui) {
      console.log(event);
      console.log(ui);
    }
  });
  $('.folder').droppable({
    hoverClass: 'drop-hover',
    drop: function(event, ui) {
      console.log(event);
      console.log(ui);
    }
  });
});
