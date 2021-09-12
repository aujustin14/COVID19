var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mysql = require('mysql');
var session = require('express-session');
var bcrypt = require('bcrypt');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(session({
    secret: "a string of your choice",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use(express.static(path.join(__dirname, 'public')));

var dbConnectionPool=mysql.createPool({host:'localhost', database: 'COVID19'});
app.use(function(req,res,next) {
    req.pool= dbConnectionPool;
    next();
});

app.use('/', indexRouter);
app.use('/users', usersRouter);

module.exports = app;
