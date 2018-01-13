'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const common = require('../config/common');

const userSchema = new Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  salt: { type: String, required: true }
}, { collection: 'polling.users' });

userSchema.methods.setPassword = function(password) {
  this.password = common.passwordHash(password, this.salt);
  this.markModified('password');
  return this;
};

userSchema.methods.validPassword = function(password) {
  return this.password === common.passwordHash(password, this.salt);
};

userSchema.methods.publicInfo = function(password) {
  return {
    username: this.username,
    email: this.email
  };
};

module.exports = mongoose.model('User', userSchema);
