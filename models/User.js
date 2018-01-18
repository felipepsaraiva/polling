'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const common = require('../config/common');

const UserSchema = new Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [4, 'Username is too short (Min 4 characters)'],
    maxlength: [15, 'Username is too long (Max 15 characters)']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password is too short (Min 6 characters)']
  },
  salt: { type: String, default: common.generateRandomString }
}, { collection: 'polling.users' });

// Alternative ID
UserSchema.virtual('aid').get(function() {
  return common.encodeId(this.id);
});

UserSchema.virtual('polls', {
  ref: 'Poll',
  localField: '_id',
  foreignField: 'author'
});

UserSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('password'))
    this.password = common.passwordHash(this.password, this.salt);

  next();
});

/**
 * Custom Validators
 */
UserSchema.path('email').validate(function(value) {
  return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/g.test(value);
}, 'Email is invalid');

UserSchema.path('username').validate(function(value) {
  return /^[a-zA-Z]{1}[\w.]*$/g.test(value);
}, 'Start username with a letter and use only alphanumeric characters, underscores or dots');

UserSchema.path('email').validate(function(value) {
  return new Promise((resolve, reject) => {
    this.model('User').count({ email: value }, function(err, count) {
      if (err) return reject(err);
      resolve(!count);
    });
  });
}, 'Email already exists');

UserSchema.path('username').validate(function(value) {
  return new Promise((resolve, reject) => {
    this.model('User').count({ username: value }, function(err, count) {
      if (err) return reject(err);
      resolve(!count);
    });
  });
}, 'Username already exists');

/**
 * Instance Methods
 */
UserSchema.methods.validPassword = function(password) {
  return this.password === common.passwordHash(password, this.salt);
};

UserSchema.methods.getPublic = function(includeAid, includePolls) {
  let result = common.getProperties(this, ['username', 'email']);

  if (includeAid)
    result.id = this.aid;

  if (includePolls && this.polls)
    result.polls = this.polls.map((e) => {
      let tmp = e.getPublic();
      delete tmp.author;
      return tmp;
    });

  return result;
};

module.exports = mongoose.model('User', UserSchema);
