'use strict';

const co = require('co');
const Poll = require('../models/Poll');
const common = require('../config/common');

/**
 * Query:
 *  q: String (Optional) - Text to be searched, if empty, lists all
 *  sort: 'recent' || 'popular'
 *  limit: Number (Default: 10) - Limit the number of results
 *  offset: Number (Default: 0) - Skip limit*offset results
 */
module.exports.search = function(req, res, next) {
  let condition = {},
    sort = { voteCount: -1 },
    limit = Math.floor(req.query.limit) || 10,
    skip = (Math.floor(req.query.offset) || 0) * limit;

  if (req.query.q)
    condition = { name: new RegExp(common.escapeRegex(req.query.q), 'i') };

  if (req.query.sort === 'recent')
    sort = { createdAt: -1 };

  co(function*() {
    return yield {
      total: Poll.count(condition),
      results: Poll.find(condition).sort(sort).limit(limit).skip(skip).exec()
    };
  }).then(function(data) {
    res.json({
      error: false,
      message: 'Found ' + data.results.length + ' result(s)',
      total: data.total,
      polls: data.results.map((result) => result.getPublic())
    });
  }).catch(next);
};

/**
 * Query:
 *  author: Boolean // Populate the result with author's information
 */
module.exports.read = function(req, res, next) {
  let id = common.decodeId(req.params.aid);
  if (!id) return next(new InvalidIdError);

  let query = Poll.findById(id);
  if (req.query.author)
    query = query.populate('author');

  query.exec().then(function(poll) {
    if (!poll) throw new InvalidIdError;
    res.json(poll.getPublic());
  }).catch(next);
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

  poll.save().then(function(poll) {
    res.json({
      error: false,
      message: 'Poll created successfully',
      poll: poll.getPublic()
    });
  }).catch(next);
};

/**
 * Body:
 *  name: String (Optional)
 *  allowNewOptions: Boolean (Optional)
 *  options: { create: [String (description)], delete: [String (aid)] } (Optional)
 */
module.exports.update = function(req, res, next) {
  let id = common.decodeId(req.params.aid);
  if (!id) return next(new InvalidIdError);

  Poll.findAuthorsPoll(id, req.user.id).then(function(poll) {
    if (!poll) throw new InvalidIdError;

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

    return poll.save();
  }).then(function(poll) {
    res.json({
      error: false,
      message: 'Poll updated successfully',
      poll: poll.getPublic()
    });
  }).catch(next);
};

module.exports.delete = function(req, res, next) {
  let id = common.decodeId(req.params.aid);
  if (!id) return next(new InvalidIdError);

  Poll.findAuthorsPoll(id, req.user.id).then(function(poll) {
    if (!poll) throw new InvalidIdError;
    return poll.remove();
  }).then(function(poll) {
    res.json({
      error: false,
      message: 'Poll deleted successfully'
    });
  }).catch(next);
};

module.exports.vote = function(req, res, next) {
  let id = common.decodeId(req.params.aid);
  if (!id) return next(new InvalidIdError);

  let optionid = common.decodeId(req.params.optionid);
  if (!optionid)
    return next(new InvalidIdError('There is no option with the ID provided'));

  Poll.findById(id).exec().then(function(poll) {
    if (!poll) throw new InvalidIdError;

    let option = poll.options.find((option) => option.id === optionid);
    if (!option)
      throw new InvalidIdError('There is no option with the ID provided');

    option.votes++;
    poll.markModified('options');
    return poll.save();
  }).then(function(poll) {
    res.json({
      error: false,
      message: 'Vote computed successfully',
      poll: poll.getPublic()
    });
  }).catch(next);
};

/**
 * Body:
 *  option: String // The description of the new option
 */
module.exports.voteNewOption = function(req, res, next) {
  let id = common.decodeId(req.params.aid);
  if (!id) return next(new InvalidIdError);

  Poll.findById(id).exec().then(function(poll) {
    if (!poll) throw new InvalidIdError;

    if (!poll.allowNewOptions) {
      throw {
        status: 403,
        name: 'Custom',
        response: {
          error: 'AuthenticationError',
          message: 'The poll does not allow the creation of new options'
        }
      };
    }

    let option = { description: req.body.option, votes: 1 };
    poll.options.push(option);

    poll.markModified('options');
    return poll.save();
  }).then(function(poll) {
    res.json({
      error: false,
      message: 'Option created successfully',
      poll: poll.getPublic()
    });
  }).catch(next);
};



/**
 * InvalidIdError (constructor)
 */
function InvalidIdError(message = 'There is no poll with the ID provided') {
  this.status = 422;
  this.name = 'Custom';
  this.response = {
    error: 'InvalidIdError',
    message: message
  };
}
