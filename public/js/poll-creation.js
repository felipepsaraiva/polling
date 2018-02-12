$(function() {
  var removedOptions = []; // Options that were removed
  var request; // Ajax request

  $('#poll-name').autoResize(); // Plugin: https://github.com/Alex1990/autoresize-textarea


  $('.js-remove-option').click(function(e) {
    var option = $(e.target).closest('li');
    var optionId = option.find('input').data('id');
    if (optionId)
      removedOptions.push(optionId);
    option.remove();
  });


  $('#add-option').click(function() {
    $('#poll-options').append($('#new-option-model li').clone(true));
  });

  if (!$('#poll-options').children().length)
    $('#add-option').click();


  $('form').submit(function(e) {
    e.preventDefault();
    if (request) return false;

    var pollId = $('#poll-id').val();
    var submitButtons = $('.js-save');

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

    console.log(data);
    submitButtons.toggleClass('d-none d-block');
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
      submitButtons.toggleClass('d-none d-block');
      console.log(xhr.responseJSON);

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
});
