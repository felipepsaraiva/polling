'use strict';

const User = require('../models/User');
const Poll = require('../models/Poll');
const common = require('../config/common');

/**
 * Self Routes
 */
module.exports.self = {};

module.exports.self.read = function(req, res, next) {
  res.json(req.user.getPublic());
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

  req.user.save(function(err, user) {
    if (err) return next(err);
    res.json({
      error: false,
      message: 'Information updated successfully',
      user: user.getPublic()
    });
  });
};

module.exports.self.delete = function(req, res, next) {
  User.findByIdAndRemove(req.user.id, function(err) {
    if (err) return next(err);
    res.json({
      error: false,
      message: 'User deleted successfully'
    });
  });
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
  req.user.save(function(err, user) {
    if (err) return next(err);
    res.json({
      error: false,
      message: 'Password updated successfully'
    });
  });
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

  query.exec(function(err, polls) {
    if (err) return next(err);
    res.json({
      error: false,
      message: 'Fetched ' + polls.length + ' poll(s)',
      polls: polls.map((poll) => poll.getPublic())
    });
  });
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

  user.save(function(err, user) {
    if (err) return next(err);

    res.json({
      error: false,
      message: 'User registered successfully',
      user: user.getPublic()
    })
  });
};

module.exports.read = function(req, res, next) {
  let id = common.decodeId(req.params.aid);
  if (!id)
    return sendInvalidId(next);

  User.findById(id, function(err, user) {
    if (err) return next(err);
    if (!user) return sendInvalidUsername(next);
    res.json(user.getPublic());
  });
};

/**
 * Query:
 *  limit: Integer (Default 10, use 0 to return all polls)
 *  offset: Integer (Default 0) - Skip offset*limit polls
 */
module.exports.polls = function(req, res, next) {
  let id = common.decodeId(req.params.aid);
  if (!id)
    return sendInvalidId(next);

  let query = Poll.find({ author: id });

  if (req.query.limit !== '0') {
    let limit = Math.floor(req.query.limit) || 10;
    query = query.limit(limit);

    if (req.query.offset) {
      let skip = (Math.floor(req.query.offset) || 0) * limit;
      query = query.skip(skip);
    }
  }

  query.exec(function(err, polls) {
    if (err) return next(err);
    res.json({
      error: false,
      message: 'Fetched ' + polls.length + ' poll(s)',
      polls: polls.map((poll) => poll.getPublic())
    });
  });
};


/**
 * Helper Functions
 */
function sendInvalidId(next, message = 'There is no user with the ID provided') {
  next({
    status: 422,
    name: 'Custom',
    response: {
      error: 'InvalidIdError',
      message: message
    }
  });
}
