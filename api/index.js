'use strict';

const express = require('express');
const router = express.Router();
const common = require('../config/common');

const auth = require('./auth');
const user = require('./user');
const poll = require('./poll');

router.post('/login', auth.login);

router.get('/me', auth.requireAuth, user.self.read);
router.put('/me', auth.requireAuth, user.self.update);
router.delete('/me', auth.requireAuth, user.self.delete);
router.put('/me/password', auth.requireAuth, user.self.changePassword);
router.get('/me/polls', auth.requireAuth, user.self.polls);

router.get('/user/search', user.search);
router.post('/user', user.create);
router.get('/user/:aid', user.read);
router.get('/user/:aid/polls', user.polls);

router.get('/poll/search', poll.search);
router.get('/poll/:aid', poll.read);
router.post('/poll', auth.requireAuth, poll.create);
router.put('/poll/:aid', auth.requireAuth, poll.update);
router.delete('/poll/:aid', auth.requireAuth, poll.delete);
router.put('/poll/:aid/vote/:optionid', poll.vote);
router.post('/poll/:aid/vote', auth.requireAuth, poll.voteNewOption);

/**
 * Helper API Routes
 */
router.get('/encode/:id', function(req, res, next) {
  res.json({ aid: common.encodeId(req.params.id) });
});

router.get('/decode/:aid', function(req, res, next) {
  res.json({ id: common.decodeId(req.params.aid) });
});

/**
 * ERROR HANDLER
 * Error types: ServerError, AuthenticationError, ValidationError, InvalidIdError, BadRequest
 */
router.use(function(err, req, res, next) {
  switch (err.name) {
    case 'ValidationError':
      res.status(422).json({
        error: err.name,
        message: err._message,
        errorList: common.extractErrors(err.errors)
      });
      break;

    case 'Custom':
      res.status(err.status).json(err.response);
      break;

    default:
      console.log('<<<<< [ERROR] >>>>>');
      console.error(err);

      res.status(500).json({
        error: 'ServerError',
        message: 'Internal server error'
      });
  }
});

module.exports = router;
