'use strict';

const passport = require('passport');
const jwt = require('jwt-simple');

module.exports.requireAuth = function(req, res, next) {
  if (!req.user) {
    next({
      status: 401,
      name: 'Custom',
      response: {
        error: 'AuthenticationError',
        message: 'You have to be authenticated to perform this action'
      }
    });
  } else {
    next();
  }
}

module.exports.login = function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err)
      return next(err);

    if (!user)
      return next({
        status: 422,
        name: 'Custom',
        response: {
          error: 'AuthenticationError',
          message: info.message
        }
      });

    let token = jwt.encode({ id: user.id }, process.env.SECRET);

    res.json({
      error: false,
      message: 'Success',
      user: user.getPublic(),
      token: token
    });
  })(req, res, next);
};
