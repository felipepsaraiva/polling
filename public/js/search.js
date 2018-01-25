'use strict';

var ajax, request, currentPage = 1;
var RESULT_LIMIT = 10;

$(function() {
  $('#type').change(function() {
    $('form').addClass('d-none');
    $('#search-' + $('#type').val()).removeClass('d-none');
  });

  $('#search-poll').submit(function(e) {
    e.preventDefault();
    currentPage = 1;

    requestSearch({
      type: 'GET',
      url: '/api/poll/search',
      data: {
        sort: $('#sort').val(),
        q: $('#pollq').val(),
        limit: RESULT_LIMIT
      },
      render: renderPolls
    });
  });

  $('#search-user').submit(function(e) {
    e.preventDefault();
    currentPage = 1;

    requestSearch({
      type: 'GET',
      url: '/api/user/search',
      data: {
        q: $('#userq').val(),
        limit: RESULT_LIMIT
      },
      render: renderUsers
    });
  });

  $('#search-' + $('#type').val()).submit();
});

function requestSearch(data, done) {
  if (request)
    request.abort('user abort');

  $('#results p, #cards').addClass('d-none');
  $('.pagination').closest('nav').addClass('d-none');
  $('#loading').removeClass('d-none');
  $('#cards').empty();

  ajax = data;
  request = $.ajax(data);

  request.always(function() {
    request = null;
    $('#loading').addClass('d-none');
  }).done(function(response) {
    ajax.render(response);
    setupPagination(response.total);
  }).fail(function(xhr, errorText) {
    if (errorText !== 'user abort')
      $('#error').removeClass('d-none');
  });
}

function renderPolls(response) {
  if (!response.polls.length)
    return $('#no-results').removeClass('d-none');

  $('#cards').removeClass('d-none');
  for (var i=0 ; i<response.polls.length ; i++) {
    var result = response.polls[i];
    $('#cards').append('<div class="col-sm-12 col-md-12 col-lg-6 my-2">'
      + '<div class="card">'
      + '<a href="/poll/' + result.id + '"></a>'
      + '<div class="card-body">'
      + '<h5 class="card-title">' + result.name + '</h5>'
      + '<h6 class="card-subtitle mb-2 text-muted">'
      + result.voteCount + ' vote(s) &middot; ' + result.author.username
      + '</h6></div></div></div>'
    );
  }
}

function renderUsers(response) {
  if (!response.users.length)
    return $('#no-results').removeClass('d-none');

  $('#cards').removeClass('d-none');
  for (var i=0 ; i<response.users.length ; i++) {
    var result = response.users[i];
    $('#cards').append('<div class="col-sm-12 col-md-12 col-lg-6 my-2">'
      + '<div class="card">'
      + '<a href="/user/' + result.username + '"></a>'
      + '<div class="card-body">'
      + '<h4 class="card-title text-center m-0">' + result.username + '</h4>'
      + '</div></div></div>'
    );
  }
}

function setupPagination(total) {
  var content, pages = Math.ceil(total/RESULT_LIMIT);
  if (pages <= 1) return;

  content = '<li class="page-item' + (currentPage > 1 ? '' : ' disabled') + '">'
    + '<' + (currentPage > 1 ? 'a' : 'span') + ' data-to="' + (currentPage-1) + '" class="page-link text-' + (currentPage > 1 ? 'warning' : 'muted') + '" aria-label="Previous">'
    + '&laquo; <span class="sr-only">Previous</span>'
    + '</' + (currentPage > 1 ? 'a' : 'span') + '></li>';

  for (var i=1 ; i<=pages ; i++) {
    if (currentPage == i)
      content += '<li class="page-item"><span class="page-link text-light bg-warning border border-warning">' + i + '</span></li>';
    else
      content += '<li class="page-item"><a data-to="' + i + '" class="page-link text-warning">' + i + '</a></li>';
  }

  content += '<li class="page-item' + (currentPage < pages ? '' : ' disabled') + '">'
    + '<' + (currentPage < pages ? 'a' : 'span') + ' data-to="' + (currentPage+1) + '" class="page-link text-' + (currentPage < pages ? 'warning' : 'muted') + '" aria-label="Next">'
    + '&raquo; <span class="sr-only">Next</span>'
    + '</' + (currentPage < pages ? 'a' : 'span') + '></li>';

  $('.pagination').html(content);
  $('.pagination').closest('nav').removeClass('d-none');
  $('.pagination a').click(function(e) {
    var page = Number($(e.target).data('to'));
    currentPage = page;
    ajax.data.offset = (page - 1);
    requestSearch(ajax);
  });
}
