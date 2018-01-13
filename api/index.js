'use strict';

const express = require('express');
const router = express.Router();

const auth = require('./auth');
// const pollApi = require('./poll');

router.post('/login', auth.login);
// router.post('/logout', authApi.logoout);
// router.post('/register', authApi.register);

router.get('/me', function(req, res) {
  if (req.user)
    res.json(req.user.publicInfo());
  else
    next({
      status: 400,
      response: {
        error: true,
        message: 'Invalid authentication token'
      }
    });
});

router.use(function(err, req, res, next) {
  if (!err.response) {
    console.log('<<<<< [ERROR] >>>>>');
    console.error(err);
  }

  res.status(err.status || 500);
  res.json(err.response || {
    error: true,
    message: 'Internal server error'
  });
});

module.exports = router;
