var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');
var compress = require('compression');
var methodOverride = require('method-override');
var helmet = require('helmet');
var cors = require('cors');


// make bluebird default Promise
Promise = require('bluebird');

//root of routes
var routes = require('./routes/index-route');


var app = express();

app.use(logger('dev'));
// parse body params and attache them to req.body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieParser());
app.use(compress());
app.use(methodOverride());

// secure apps by setting various HTTP headers
app.use(helmet());

// enable CORS - Cross Origin Resource Sharing
app.use(cors());

// mount all routes on /api path
app.use('/api', routes);

app.use(express.static(path.join(__dirname, 'public')));

module.exports = app;
