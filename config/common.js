'use strict';

const crypto = require('crypto');

const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const base62 = require('base-x')(chars);

/**
 * generateRandomString - Returns a random-generated hexadecimal string with 'length' characters
 */
module.exports.generateRandomString = function(length = 32) {
  return crypto.randomBytes(Math.ceil(length/2))
    .toString('hex')
    .slice(0, length);
};

/**
 * passwordHash - Hashes a string with a salt with sha512 algorithm
 */
module.exports.passwordHash = function(password, salt) {
  var hmac = crypto.createHmac('sha512', salt);
  hmac.update(password);
  return hmac.digest('hex');
};

/**
 * encodeId - Encodes ObjectIDs with base62
 */
module.exports.encodeId = function(id) {
  try {
    return base62.encode(Buffer.from(id, 'hex'));
  } catch (e) {
    return false;
  }
};

/**
 * decodeId - Decodes base62 IDs to ObjectIDs
 */
module.exports.decodeId = function(encodedId) {
  try {
    let id = base62.decode(encodedId).toString('hex');
    if (id.length == 24)
      return id;
    else
      return false;
  } catch (e) {
    return false;
  }
};

/**
 * getProperties - Returns a new object with the specified properties copied from the source object
 */
const getProperties = function(source, props) {
  let result = {};

  if (Array.isArray(source)) {
    result = [];
    for (let i = 0 ; i < source.length ; i++) {
      result.push(getProperties(source[i], props));
    }
  } else {
    for (let i = 0 ; i < props.length ; i++) {
      let prop = props[i];

      if (typeof prop === 'string') {
        result[prop] = source[prop];
      } else if (typeof prop === 'object') {
        let key = Object.keys(prop)[0];
        result[key] = getProperties(source[key], prop[key]);
      }
    }
  }

  return result;
};
module.exports.getProperties = getProperties;

/**
 * extractErrors - Extract error's messages from the ValidationError object
 */
module.exports.extractErrors = function(errors, msgs = {}) {
  Object.keys(errors).forEach((path) => {
    if (!msgs[path])
      msgs[path] = errors[path].message;
  });
  return msgs;
};
