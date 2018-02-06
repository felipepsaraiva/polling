'use strict';

$(function() {
  var request; // Represents the XHR request (used on submit)
  $('form')[0].reset(); // Remove any option selected before a refresh

  $('#option-input').on('focus', function() {
    $('#option-new + label').click()
  });

  $('input[name=option]').on('change', function(e) {
    $('form label').removeClass('text-warning');
    $('.fa-li > i').removeClass('fa-dot-circle');
    $('.fa-li > i').addClass('fa-circle');

    var label = $(this).next('label');
    label.addClass('text-warning');
    label.children('.fa-li').children('i').toggleClass('fa-circle fa-dot-circle');
  });

  $('form').submit(function(e) {
    e.preventDefault();
    // Check if a request is already happening
    if (request)
      return false;

    $('.alert-danger').addClass('d-none');
    var data = $('form').serializeArray().reduce((data, current) => {
      data[current.name] = current.value;
      return data;
    }, {});
    console.log(data);

    // Check if an option is selected
    if (!data.option) {
      $('.alert-danger').text('You must choose one option!');
      $('.alert-danger').removeClass('d-none');
      return false;
    }

    if (data.option == 'new') {
      if (!$('#option-input').val()) {
        $('.alert-danger').text('You must name the new option!');
        $('.alert-danger').removeClass('d-none');
        return false;
      }

      request = $.ajax({
        type: 'POST',
        url: '/api/poll/' + data.pollId + '/vote',
        headers: { 'Access-Header': Cookies.get('token') },
        contentType: 'application/json',
        data: JSON.stringify({
          option: $('#option-input').val()
        })
      });
    } else {
      request = $.ajax({
        type: 'PUT',
        url: '/api/poll/' + data.pollId + '/vote/' + data.option
      });
    }

    $('form button').toggleClass('d-none d-block');

    request.done(function(response) {
      window.location.reload();
    }).fail(function(xhr, status) {
      request = null;
      $('form button').toggleClass('d-none d-block');
      $('.alert-danger').text(xhr.responseJSON.message);
      $('.alert-danger').removeClass('d-none');
    });
  });
});
