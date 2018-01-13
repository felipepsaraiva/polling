'use strict';

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');

passport.use(new LocalStrategy(function(username, password, done) {
  if (!(username && password))
    return done(null, false, { message: 'Username and password are required' });

  User.findOne({ username: username }, function(err, user) {
    if (err)
      done(err);
    else if (!(user && user.validPassword(password)))
      done(null, false, { message: 'Invalid username or password' });
    else
      done(null, user);
  });
}));
