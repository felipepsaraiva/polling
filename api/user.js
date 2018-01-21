'use strict';

const User = require('../models/User');
const Poll = require('../models/Poll');
const common = require('../config/common');

/**
 * Self Routes
 */
module.exports.self = {};

module.exports.self.read = function(req, res, next) {
  res.json({
    error: false,
    message: 'Success',
    user: req.user.getPublic()
  });
};

/**
 * Body:
 *  email: String (Optional)
 *  username: String (Optional)
 */
module.exports.self.update = function(req, res, next) {
  if (req.body.email)
    req.user.email = req.body.email;

  if (req.body.username)
    req.user.username = req.body.username;

  req.user.save().then(function(user) {
    res.json({
      error: false,
      message: 'Information updated successfully',
      user: user.getPublic()
    });
  }).catch(next);
};

module.exports.self.delete = function(req, res, next) {
  req.user.remove().then(function(user) {
    return Poll.remove({ author: user.id }).exec();
  }).then(function() {
    res.json({
      error: false,
      message: 'Account deleted successfully'
    });
  }).catch(next);
};

/**
 * Body:
 *  currentPassword: String
 *  newPassword: String
 */
module.exports.self.changePassword = function(req, res, next) {
  if (!req.user.validPassword(req.body.currentPassword))
    return next({
      status: 403,
      name: 'Custom',
      response: {
        error: 'AuthenticationError',
        message: 'You must provide your current password correctly'
      }
    });

  req.user.password = req.body.newPassword;
  req.user.save().then(function(user) {
    res.json({
      error: false,
      message: 'Password updated successfully'
    });
  }).catch(next);
};

/**
 * Query:
 *  limit: Integer (Default 10, use 0 to return all polls)
 *  offset: Integer (Default 0) - Skip offset*limit polls
 */
module.exports.self.polls = function(req, res, next) {
  let query = Poll.find({ author: req.user.id });

  if (req.query.limit !== '0') {
    let limit = Math.floor(req.query.limit) || 10;
    query = query.limit(limit);

    if (req.query.offset) {
      let skip = (Math.floor(req.query.offset) || 0) * limit;
      query = query.skip(skip);
    }
  }

  query.exec().then(function(polls) {
    res.json({
      error: false,
      message: 'Fetched ' + polls.length + ' poll(s)',
      polls: polls.map((poll) => poll.getPublic())
    });
  }).catch(next);
};


/**
 * User Routes
 */

/**
 * Body:
 *  email: String
 *  username: String
 *  password: String
 */
module.exports.create = function(req, res, next) {
  let user = new User({
    email: req.body.email,
    username: req.body.username,
    password: req.body.password
  });

  user.save().then(function(user) {
    res.json({
      error: false,
      message: 'User registered successfully',
      user: user.getPublic()
    });
  }).catch(next);
};

module.exports.read = function(req, res, next) {
  let id = common.decodeId(req.params.aid);
  if (!id) return next(new InvalidIdError);

  User.findById(id).exec().then(function(user) {
    if (!user) throw new InvalidIdError;
    res.json({
      error: false,
      message: 'Success',
      user: user.getPublic()
    });
  }).catch(next);
};

/**
 * Query:
 *  limit: Integer (Default 10, use 0 to return all polls)
 *  offset: Integer (Default 0) - Skip offset*limit polls
 */
module.exports.polls = function(req, res, next) {
  let id = common.decodeId(req.params.aid);
  if (!id) return next(new InvalidIdError);

  let query = Poll.find({ author: id });

  if (req.query.limit !== '0') {
    let limit = Math.floor(req.query.limit) || 10;
    query = query.limit(limit);

    if (req.query.offset) {
      let skip = (Math.floor(req.query.offset) || 0) * limit;
      query = query.skip(skip);
    }
  }

  query.exec().then(function(polls) {
    res.json({
      error: false,
      message: 'Fetched ' + polls.length + ' poll(s)',
      polls: polls.map((poll) => poll.getPublic())
    });
  }).catch(next);
};


/**
 * Helper Functions
 */
function InvalidIdError(message = 'There is no user with the ID provided') {
  this.status = 422;
  this.name = 'Custom';
  this.response = {
    error: 'InvalidIdError',
    message: message
  };
}
