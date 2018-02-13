'use strict';
require('dotenv').config();

const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const jwt = require('jwt-simple');

const passport = require('passport');
require('./config/passport'); // Execute Passport's configuration code

const compression = require('compression');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const favicon = require('serve-favicon');

const express = require('express');
const app = express();

const api = require('./api');
const webClientRoutes = require('./routes');
const User = require('./models/User');

/**
 * Connect to MongoDB
*/
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGO_URI, { useMongoClient: true });
mongoose.connection.on('error', function() {
  console.error('Unable to connect to MongoDB');
  process.exit();
});

/**
 * Express Configuration
 */
app.set('port', process.env.PORT || 3000);
app.set('view engine', 'ejs');

app.use(compression());
app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.png')))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'common' : 'dev'));
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());
app.use('/assets', express.static(path.join(__dirname, 'public')));


// Authenticate the request
app.use(function(req, res, next) {
  try {
    let token = req.get('Access-Header') || req.cookies.token;
    let id = jwt.decode(token, process.env.SECRET).id;

    User.findById(id, function(err, user) {
      if (user)
        req.user = user;
      else if (req.cookies.token)
        res.clearCookie('token');

      next();
    });
  } catch (e) {
    next();
  }
});

app.use('/api', cors(), api);
app.use('/', webClientRoutes);

app.listen(app.get('port'), function() {
  console.log('App is running on port ' + app.get('port') + ' in ' + process.env.NODE_ENV + ' mode...');
});
