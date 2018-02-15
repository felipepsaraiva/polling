'use strict';

$(function() {
  var request;

  $('form').submit(function(e) {
    e.preventDefault();
    if (request) return false;

    $('.form-group input').removeClass('is-valid is-invalid');

    var data = {
      name: $('#name input').val(),
      username: $('#username input').val(),
      password: $('#password input').val()
    };

    if (data.password !== $('#rpassword input').val()) {
      $('#rpassword .invalid-feedback').text('Must match the password');
      $('#rpassword input').addClass('is-invalid');
    } else {
      $('#page-register button').toggleClass('d-none');

      request = $.ajax({
        type: 'POST',
        url: '/api/user',
        contentType: 'application/json',
        data: JSON.stringify(data)
      }).done(function(response) {
        window.location = '/login';
      }).fail(function(xhr, status) {
        request = null;
        $('#page-register button').toggleClass('d-none');
        $('.form-group input').addClass('is-valid');

        xhr.responseJSON.errorList.forEach(function(error) {
          $('#' + error.path + ' .invalid-feedback').text(error.message);
          $('#' + error.path + ' input').toggleClass('is-valid is-invalid');
        });
      });
    }
  });
});
