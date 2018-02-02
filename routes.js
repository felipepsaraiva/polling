'use strict';

const express = require('express');
const router = express.Router();

const co = require('co');
const common = require('./config/common');
const User = require('./models/User');
const Poll = require('./models/Poll');

router.get('/', function(req, res, next) {
  co(function* () {
    let data = yield {
      popular: Poll.find({}).limit(4).sort({ voteCount: -1 }).populate('author').exec(),
      recent: Poll.find({}).limit(4).sort({ createdAt: -1 }).populate('author').exec()
    };

    return data;
  }).then(function(data) {
    res.render('home', {
      user: req.user,
      polls: {
        popular: data.popular,
        recent: data.recent
      }
    });
  }).catch(function(err) {
    res.render('home', { user: req.user });
  });
});

router.get('/login', function(req, res, next) {
  res.render('login');
});

router.get('/register', function(req, res, next) {
  res.render('register', { user: req.user });
});

router.get('/settings', function(req, res, next) {
  if (!req.user)
    return res.redirect('/');

  res.render('settings', { user: req.user });
});

router.get('/search', function(req, res, next) {
  res.render('search', { user: req.user, query: req.query });
});

router.get('/user/:uname', function(req, res, next) {
  let uname = req.params.uname;

  User.findOne({ username: uname }).populate({
    path: 'polls',
    options: {
      sort: { createdAt: -1 },
      limit: 60
    }
  }).exec().then(function(profile) {
    if (profile) {
      if (profile.polls)
        profile.polls.sort(function(a, b) {
          let nameA = a.name.toLowerCase();
          let nameB = b.name.toLowerCase();

          if (nameA == nameB)
            return 0;
          else if (nameA < nameB)
            return -1;
          else
            return 1;
        });

      res.render('profile', { user: req.user, profile });
    } else {
      next({ status: 404 });
    }
  }).catch(next);
});

// Error Handler
router.use(function(err, req, res, next) {
  res.status(err.status || 500);
  switch (err.status) {
    case 404:
      res.render('error-404', { user: req.user });
      break;

    default:
      res.render('error-500', { user: req.user });
  }
});

module.exports = router;
