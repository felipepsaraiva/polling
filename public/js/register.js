$(function() {
  var request;

  $('form').submit(function(e) {
    e.preventDefault();

    if (!request) {
      $('.form-group input').removeClass('is-valid is-invalid');
      $('.form-group .invalid-feedback').text('');
      $('.alert').addClass('d-none');

      var data = {
        email: $('#email input').val(),
        username: $('#username input').val(),
        password: $('#password input').val()
      };

      if (data.password !== $('#rpassword input').val()) {
        $('#rpassword .invalid-feedback').text('Must match the password');
        $('#rpassword input').addClass('is-invalid');
      } else {
        $('button').toggleClass('d-none d-block');

        request = $.ajax({
          type: 'POST',
          url: '/api/user',
          contentType: 'application/json',
          data: JSON.stringify(data)
        }).always(function() {
          request = null;
          $('button').toggleClass('d-none d-block');
        }).done(function(response) {
          $('form')[0].reset();
          $('.alert').removeClass('d-none');
        }).fail(function(xhr, status) {
          $('.form-group input').addClass('is-valid');
          xhr.responseJSON.errorList.forEach(function(error) {
            $('#' + error.path + ' .invalid-feedback').text(error.message);
            $('#' + error.path + ' input').toggleClass('is-valid is-invalid');
          });
        });
      }
    }
  });
});
