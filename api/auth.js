'use strict';

const passport = require('passport');
const jwt = require('jwt-simple');

module.exports.login = function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err)
      return next(err);

    if (!user)
      return next({
        status: 422,
        response: {
          error: true,
          message: info.message
        }
      });

    let token = jwt.encode({ id: user.id }, process.env.SECRET);

    res.json({
      error: false,
      message: 'Success',
      user: user.publicInfo(),
      token: token
    });
  })(req, res, next);
};
