'use strict';

$(function() {
  var requests = {};

  // Update information submit
  $('#user-information form').submit(function(e) {
    e.preventDefault();

    if (!requests['update-info']) {
      $('#user-information input').removeClass('is-valid is-invalid');
      $('#user-information .alert').addClass('d-none');
      $('#user-information button').toggleClass('d-none d-block');

      requests['update-info'] = $.ajax({
        type: 'PUT',
        url: '/api/me',
        headers: { 'Access-Header': Cookies.get('token') },
        contentType: 'application/json',
        data: JSON.stringify({
          email: $('#email input').val(),
          username: $('#username input').val()
        })
      }).always(function() {
        delete requests['update-info'];
        $('#user-information button').toggleClass('d-none d-block');
      }).done(function(response) {
        $('#email').val(response.user.email);
        $('#username').val(response.user.username);
        $('#user-information .alert-success').removeClass('d-none');
      }).fail(function(xhr, status) {
        $('#user-information input').addClass('is-valid');
        xhr.responseJSON.errorList.forEach(function(error) {
          $('#' + error.path + ' .invalid-feedback').text(error.message);
          $('#' + error.path + ' input').toggleClass('is-valid is-invalid');
        });
      });
    }
  });

  // Change password submit
  $('#change-password form').submit(function(e) {
    e.preventDefault();

    if (!requests['change-password']) {
      $('#change-password input').removeClass('is-valid is-invalid');
      $('#change-password .alert').addClass('d-none');

      var data = {
        currentPassword: $('#current-password input').val(),
        newPassword: $('#password input').val()
      };

      if (data.newPassword !== $('#rpassword input').val()) {
        $('#rpassword .invalid-feedback').text('Must match the password');
        $('#rpassword input').addClass('is-invalid');
      } else {
        $('#change-password button').toggleClass('d-none d-block');

        requests['change-password'] = $.ajax({
          type: 'PUT',
          url: '/api/me/password',
          headers: { 'Access-Header': Cookies.get('token') },
          contentType: 'application/json',
          data: JSON.stringify(data)
        }).always(function() {
          delete requests['change-password'];
          $('#change-password button').toggleClass('d-none d-block');
        }).done(function(response) {
          $('#change-password form')[0].reset();
          $('#change-password .alert-success').removeClass('d-none');
        }).fail(function(xhr, status) {
          if (xhr.responseJSON.error === 'AuthenticationError') {
            $('#current-password .invalid-feedback').text(xhr.responseJSON.message);
            $('#current-password input').addClass('is-invalid');
          } else {
            $('#change-password input').addClass('is-valid');
            xhr.responseJSON.errorList.forEach(function(error) {
              $('#' + error.path + ' .invalid-feedback').text(error.message);
              $('#' + error.path + ' input').toggleClass('is-valid is-invalid');
            });
          }
        });
      }
    }
  });

  // Delete account
  $('#delete-username').on('input', function() {
    $('#delete-action').prop('disabled', $('#delete-username').val() !== $('#real-username').val());
  });

  $('#delete-action').click(function() {
    if (!requests['delete-account']) {
      $('#delete-username').prop('disabled', true);
      $('#delete-account-modal .btn-danger').toggleClass('d-none');
      $('#delete-account-modal .alert').addClass('d-none');

      requests['delete-account'] = $.ajax({
        type: 'DELETE',
        url: '/api/me',
        headers: { 'Access-Header': Cookies.get('token') }
      }).done(function(response) {
        window.location = '/';
      }).fail(function(xhr, status) {
        $('#delete-username').prop('disabled', false);
        $('#delete-username').val('');
        $('#delete-account-modal .btn-danger').toggleClass('d-none');
        $('#delete-account-modal .alert').removeClass('d-none');
      });
    }
  });
});
