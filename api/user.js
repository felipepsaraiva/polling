'use strict';

/**
 * Self Routes
 */
module.exports.self = {};

module.exports.self.read = function(req, res, next) {
  res.json(req.user.getPublic());
};



/**
 * User Routes
 */
