var config = require('./app_config.json');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var users = require('./routes/users');
var ParseServer = require('parse-server').ParseServer;

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

/** Parse Server Settings */
var api = new ParseServer(
    {
        databaseURI: databaseUri || config.databaseURI,
        cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
        appId: process.env.APP_ID || config.appId,
        masterKey: process.env.MASTER_KEY || config.masterKey, //Add your master key here. Keep it secret!
        serverURL: process.env.SERVER_URL || config.serverURL, // Don't forget to change to https if needed
        allowClientClassCreation:config.allowClientClassCreation,
        publicServerURL: config.serverURL,
        // Your apps name. This will appear in the subject and body of the emails that are sent.
        appName: 'MyParse App'
    }
);

// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || '/parse';
console.log('mountPath :'+mountPath);
app.use(mountPath, api);
/** End of Parse Server Settings */


app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
