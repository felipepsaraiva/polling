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

router.get('/poll/:aid', function(req, res, next) {
  let id = common.decodeId(req.params.aid);
  if (!id) return next({ status: 404 });

  Poll.findById(id).populate('author').exec()
    .then(function(poll) {
      if (poll) {
        poll.options.forEach((option) => option.aid = common.encodeId(option.id));
        res.render('poll', {
          user: req.user,
          generateRandomColor: common.generateRandomColor,
          poll
        });
      } else
        next({ status: 404 });
    }).catch(next);
});

/**
 * Query:
 *  edit: AID - The id of the poll that will be edited, if not provided, indicates a new poll
 */
router.get('/poll', function(req, res, next) {
  if (!req.user)
    return res.redirect('/');

  let id = common.decodeId(req.query.edit);
  if (!id)
    return res.render('poll-creation', { user: req.user });

  Poll.findById(id).exec().then(function(poll) {
    if (poll) {
      if (poll.author.toString('hex') == req.user.id) {
        poll.options.forEach((option) => option.aid = common.encodeId(option.id));
        res.render('poll-creation', {
          user: req.user,
          poll
        });
      } else
        next({ status: 403, asset: 'poll' });
    } else
      next({ status: 404 });
  }).catch(next);
});


// Error Handler
router.use(function(err, req, res, next) {
  res.status(err.status || 500);
  switch (err.status) {
    case 403:
      res.render('error-403', { user: req.user, asset: err.asset });
      break;

    case 404:
      res.render('error-404', { user: req.user });
      break;

    default:
      console.log(err);
      res.render('error-500', { user: req.user });
  }
});

module.exports = router;
