$(function() {
  var request;

  $('form').submit(function(e) {
    e.preventDefault();

    if (!request) {
      $('#page-login button').toggleClass('d-none');
      $('#error-message').addClass('d-none');

      request = $.ajax({
        type: 'POST',
        url: '/api/login',
        contentType: 'application/json',
        data: JSON.stringify({
          username: $('#username input').val(),
          password: $('#password input').val()
        })
      }).done(function(response) {
        Cookies.set('token', response.token);
        window.location = '/';
      }).fail(function(xhr, status) {
        $('#error-message').text(xhr.responseJSON.message);
        $('#error-message').removeClass('d-none');
        $('#page-login button').toggleClass('d-none');
        request = null;
      });
    }
  });
});
