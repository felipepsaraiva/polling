'use strict';

const Poll = require('../models/Poll');
const common = require('../config/common');

/**
 * Query:
 *  author: Boolean // Populate the result with author's information
 */
module.exports.read = function(req, res, next) {
  let id = common.decodeId(req.params.aid);
  if (!id)
    return sendInvalidId(next);

  let query = Poll.findById(id);
  if (req.query.author)
    query = query.populate('author');

  query.exec(function(err, poll) {
    if (err) return next(err);
    if (!poll) return sendInvalidId(next);

    res.json(poll.getPublic());
  });
};

/**
 * Body:
 *  name: String
 *  allowNewOptions: Boolean (Optional)
 *  options: [String] // Array with the description of each option
 */
module.exports.create = function(req, res, next) {
  let poll = Poll({
    author: req.user.id,
    name: req.body.name
  });

  if (req.body.allowNewOptions === false)
    poll.allowNewOptions = false;

  if (Array.isArray(req.body.options)) {
    req.body.options.forEach(function(option) {
      poll.options.push({ description: option });
    });
    poll.markModified('options');
  }

  poll.save(function(err, poll) {
    if (err)
      return next(err);

    res.json({
      error: false,
      message: 'Poll created successfully',
      poll: poll.getPublic()
    });
  });
};

/**
 * Body:
 *  name: String (Optional)
 *  allowNewOptions: Boolean (Optional)
 *  options: { create: [String (description)], delete: [String (aid)] } (Optional)
 */
module.exports.update = function(req, res, next) {
  let id = common.decodeId(req.params.aid);
  if (!id)
    return sendInvalidId(next);

  Poll.findAuthorsPoll(id, req.user.id, function(err, poll) {
    if (err) return next(err);
    if (!poll) return sendInvalidId(next);

    if (req.body.name)
      poll.name = req.body.name;

    if (req.body.hasOwnProperty('allowNewOptions'))
      poll.allowNewOptions = req.body.allowNewOptions;

    if (req.body.options) {
      if (Array.isArray(req.body.options.create))
        req.body.options.create.forEach((option) => poll.options.push({ description: option }));

      if (Array.isArray(req.body.options.delete))
        req.body.options.delete.forEach((aid) => {
          let optid = common.decodeId(aid);
          let index = poll.options.findIndex((option) => option.id == optid);
          if (index >= 0)
            poll.options.splice(index, 1);
        });

      poll.markModified('options');
    }

    poll.save(function(err, polldoc) {
      if (err) return next(err);

      res.json({
        error: false,
        message: 'Poll updated successfully',
        poll: polldoc.getPublic()
      });
    });
  });
};

module.exports.delete = function(req, res, next) {
  let id = common.decodeId(req.params.aid);
  if (!id)
    return sendInvalidId(next);

  Poll.findAuthorsPoll(id, req.user.id, function(err, poll) {
    if (err) return next(err);
    if (!poll) return sendInvalidId(next);

    Poll.findByIdAndRemove(id, function(err) {
      if (err) return next(err);
      res.json({
        error: false,
        message: 'Poll deleted successfully'
      });
    });
  });
};

module.exports.vote = function(req, res, next) {
  let id = common.decodeId(req.params.aid);
  let optionid = common.decodeId(req.params.optionid);

  if (!id)
    return sendInvalidId(next);
  if (!optionid)
    return sendInvalidId(next, 'The ID provided for the option is invalid');

  Poll.findById(id, function(err, poll) {
    if (err) return next(err);
    if (!poll) return sendInvalidId(next);

    let option = poll.options.find((option) => option.id === optionid);
    if (option) {
      option.votes++;
      poll.markModified('options');

      poll.save(function(err, polldoc) {
        if (err) return next(err);

        res.json({
          error: false,
          message: 'Vote computed successfully'
        });
      });
    } else {
      sendInvalidId(next, 'There is no option with the ID provided');
    }
  });
};

/**
 * Body:
 *  option: String // The description of the new option
 */
module.exports.voteNewOption = function(req, res, next) {
  let id = common.decodeId(req.params.aid);
  if (!id)
    return sendInvalidId(next);

  Poll.findById(id, function(err, poll) {
    if (err) return next(err);
    if (!poll) return sendInvalidId(next);

    if (!poll.allowNewOptions)
      return next({
        status: 403,
        name: 'Custom',
        response: {
          error: 'AuthenticationError',
          message: 'The poll does not allow the creation of new options'
        }
      });

    let option = { description: req.body.option, votes: 1 };
    poll.options.push(option);
    poll.markModified('options');

    poll.save(function(err) {
      if (err) return next(err);

      res.json({
        error: false,
        message: 'Option created successfully'
      });
    });
  });
};



/**
 * Helper Functions
 */
function sendInvalidId(next, message = 'There is no poll with the ID provided') {
  next({
    status: 422,
    name: 'Custom',
    response: {
      error: 'InvalidIdError',
      message: message
    }
  });
}
