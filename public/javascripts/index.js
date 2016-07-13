$(function() {
  $('form.signup input[type="submit"]').click(function(e) {
    e.preventDefault();

    $('.signup').hide();
    $('.loading').show();

    $.post($('form.signup').attr('action'), {
      email: $('form.signup input[type="email"]').val()
    }, function(data) {
      $('.loading').hide();
      if (data.success) {
        $('.thanks').show();
      } else {
        if (data.message) {
          $('.fail').html(data.message);
        }
        $('.fail').show();
        $('.signup').show();
      }
    });
  });
});
