$(function() {
  var removedOptions = []; // Options that were removed
  var request; // Ajax request
  var deleteWarning = false; // Indicates if the warning has been shown before deleting

  $('#poll-name').autoResize(); // Plugin: https://github.com/Alex1990/autoresize-textarea


  $('.js-remove-option').click(function(e) {
    var option = $(e.target).closest('li');
    var optionId = option.find('input').data('id');
    if (optionId)
      removedOptions.push(optionId);
    option.remove();
  });


  $('#add-option').click(function() {
    var newOption = $('#new-option-model li').clone(true);
    $('#poll-options').append(newOption);
    newOption.find('input').focus();
  });

  if (!$('#poll-options').children().length)
    $('#add-option').click();


  $('form').submit(function(e) {
    e.preventDefault();
    if (request) return false;

    var pollId = $('#poll-id').val();
    var submitButtons = $('#save-action button');

    var newOptions = [];
    $('.js-new-option').each(function(index, element) {
      var val = $(element).val().trim();
      if (val) newOptions.push(val);
    });

    var data = {
      name: $('#poll-name').val().replace('\n', ' '),
      allowNewOptions: $('#allowNewOptions').is(':checked'),
      options: newOptions
    };

    if (pollId) {
      data.options = {};
      if (newOptions.length)
        data.options.create = newOptions;
      if (removedOptions.length)
        data.options.delete = removedOptions;
    }

    submitButtons.toggleClass('d-none');
    $('#poll-error, #poll-name-error, #poll-options-error').empty().addClass('d-none');

    request = $.ajax({
      type: (pollId ? 'PUT' : 'POST'),
      url: '/api/poll' + (pollId ? '/' + pollId :  ''),
      headers: { 'Access-Header': Cookies.get('token') },
      contentType: 'application/json',
      data: JSON.stringify(data)
    });

    request.done(function(response) {
      window.location = '/poll/' + response.poll.id;
    }).fail(function(xhr, status) {
      request = null;
      submitButtons.toggleClass('d-none');

      if (xhr.responseJSON.errorList) {
        xhr.responseJSON.errorList.forEach(function(error) {
          var id = '#poll-error';

          if (error.path === 'name')
            id = '#poll-name-error';
          else if (error.path.includes('options'))
            id = '#poll-options-error';

          $(id).append('<p class="m-0">' + error.message + '</p>');
          $(id).removeClass('d-none');
        });
      }
    });
  });

  $('#delete-action button').click(function() {
    if (request) return false;
    if (!deleteWarning) {
      $('#delete-action p').removeClass('d-none');
      deleteWarning = true;
      return;
    }

    var pollId = $('#poll-id').val();
    var deleteButtons = $('#delete-action button');
    deleteButtons.toggleClass('d-none');

    request = $.ajax({
      type: 'DELETE',
      url: '/api/poll/' + pollId,
      headers: { 'Access-Header': Cookies.get('token') }
    });

    request.done(function (response) {
      deleteButtons.toggleClass('d-none');
      var msg = $('#delete-action p');
      msg.toggleClass('text-danger text-success small');
      msg.text(response.message);

      setTimeout(function () {
        window.location = '/';
      }, 1000);
    }).fail(function (xhr, status) {
      request = null;
      deleteButtons.toggleClass('d-none');
      $('#delete-action p').text(xhr.responseJSON.message);
    });
  });
});
