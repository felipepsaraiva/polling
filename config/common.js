'use strict';

const crypto = require('crypto');

module.exports.generateRandomString = function(length = 16) {
  return crypto.randomBytes(Math.ceil(length/2))
    .toString('hex')
    .slice(0, length);
};

module.exports.passwordHash = function(password, salt) {
  var hmac = crypto.createHmac('sha512', salt);
  hmac.update(password);
  return hmac.digest('hex');
};
