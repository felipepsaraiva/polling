$(function() {
  $('form').submit(function(e) {
    e.preventDefault();
    let data = {
      username: $('#username input').val(),
      password: $('#password input').val()
    };

    $.ajax({
      type: 'POST',
      url: '/api/login',
      contentType: 'application/json',
      data: JSON.stringify(data),
      success: function(result) {
        Cookies.set('token', result.token);
        window.location = '/';
      },
      error: function(xhr, status, error) {
        if (xhr.responseJSON) {
          $('#password p').text(xhr.responseJSON.message);
          $('#password p').removeClass('d-none');
        }
      }
    });
  });
});
