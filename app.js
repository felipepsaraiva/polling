'use strict';
require('dotenv').config();

const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const cors = require('cors');
const jwt = require('jwt-simple');

const passport = require('passport');
require('./config/passport'); // Execute Passport's configuration code

const express = require('express');
const app = express();

const api = require('./api');
const User = require('./models/User');

/**
 * Connect to MongoDB
*/
mongoose.connect(process.env.MONGO_URI);
mongoose.connection.on('error', function() {
  console.error('Unable to connect to MongoDB');
  process.exit();
});

/**
 * Express Configuration
 */
app.set('port', process.env.PORT || 3000);
app.set('view engine', 'ejs');

app.use(helmet());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(passport.initialize());
app.use('/assets', express.static(path.join(__dirname, 'public')));


// Authenticate the request
app.use(function(req, res, next) {
  let token = req.get('Access-Header') || req.cookies.token;

  if (token) {
    let id = jwt.decode(token, process.env.SECRET).id;
    
    User.findById(id, function(err, user) {
      if (user)
        req.user = user;
      else if (req.cookies.token)
        res.clearCookie('token');

      next();
    });
  } else {
    next();
  }
});

app.use('/api', cors(), api);
app.get('/', function(req, res) {
  res.render('index', { user: req.user });
});

app.listen(app.get('port'), function() {
  console.log('App is running on port ' + app.get('port') + '...');
});
