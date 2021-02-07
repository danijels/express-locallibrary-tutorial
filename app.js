const createError = require('http-errors');
const helmet = require('helmet');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
require('dotenv').config();
const mongoose = require('mongoose');
const { Schema } = mongoose; //=== const Schema = mongoose.Schema i.e mongoose === require('mongoose')!!!

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const catalogRouter = require('./routes/catalog');

const app = express();
/*==================================================================================================================*/
//Set up default mongoose connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection
//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

/*=================================================================================================================*/
// view engine setup
app.set('views', path.join(__dirname, 'views')); //This is where I set the root, the first part of every url path that is the first arg in res.render methods.i.e.this tells express that it should search for TEMPLATES in the views directory
app.set('view engine', 'pug'); 

app.use(helmet);
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/catalog', catalogRouter); //now all the catalog routes have /catalog prepended to them
// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
