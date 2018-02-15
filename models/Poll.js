'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const common = require('../config/common');

const PollSchema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [3, 'Name is too short (Min is 3 characters)'],
    maxlength: [100, 'Name is too long (Max is 100 characters)']
  },
  createdAt: { type: Date, default: Date.now },
  allowNewOptions: { type: Boolean, default: true },
  voteCount: { type: Number, default: 0 },
  options: {
    type: [{
      description: {
        type: String,
        required: [true, 'Options\'s description is required'],
        trim: true,
        maxlength: [100, 'Option is too long (Max is 100 characters)']
      },
      votes: { type: Number, default: 0 }
    }],
    required: [true, 'You must create at least one option']
  }
}, { collection: (process.env.DB_ENV === 'development' ? 'polling.dev.polls' : 'polling.polls') });

// Alternative ID
PollSchema.virtual('aid').get(function() {
  return common.encodeId(this.id);
});

PollSchema.pre('save', function(next) {
  this.voteCount = this.options.reduce((total, option) => total + option.votes, 0);
  next();
});

/**
 * Instance Methods
 */
PollSchema.methods.getPublic = function() {
  let result = common.getProperties(this, ['author', 'name', 'createdAt', 'allowNewOptions', 'voteCount', { options: ['id', 'description', 'votes'] }]);
  result.options.forEach((option) => option.id = common.encodeId(option.id));
  result.createdAt = result.createdAt.getTime();
  result.id = this.aid;

  if (result.author.username) // If poll is populated
    result.author = this.author.getPublic(true);
  else
    result.author = common.encodeId(result.author.id);

  return result;
};

/**
 * Static Methods
 */
PollSchema.statics.findAuthorsPoll = function(pollId, authorId) {
  return new Promise((resolve, reject) => {
    this.findById(pollId).exec().then(function(poll) {
      if (!poll || (authorId === poll.author.toString('hex')))
        resolve(poll);
      else
        reject({
          status: 403,
          name: 'Custom',
          response: {
            error: 'AuthenticationError',
            message: 'You are not the author of this poll'
          }
        });
    }).catch(reject);
  });
};

module.exports = mongoose.model('Poll', PollSchema);
